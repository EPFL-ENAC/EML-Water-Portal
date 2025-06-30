import datetime
import io
import json

import numpy as np
import pandas as pd
import pkg_resources
from api.cache import redis
from api.config import config
from api.models.measures import (
    DatasetFile,
    Datasets,
    SensorData,
    SensorDataSpec,
    Vector,
)
from api.services.db import DBQuery, DBUnionQuery, db_client
from api.services.s3 import s3_client
from fastapi.exceptions import HTTPException
from fastapi.logger import logger

lock = redis.lock("s3_measures", timeout=10)

START_DATETIME = datetime.datetime(2024, 4, 8)


class MeasuresService:
    async def get_datasets(self) -> Datasets:
        """Get the datasets from the S3 storage

        Returns:
            Datasets: The datasets description
        """
        data_file_path = pkg_resources.resource_filename(
            "api", "data/datasets.json"
        )
        with open(data_file_path) as f:
            datasets_dict = json.load(f)
            return Datasets(**datasets_dict)
        return Datasets()

    async def get_dataset(
        self, name: str, from_date=None, to_date=None, allow_resample=True
    ) -> SensorData:
        """Get a dataset from the S3 or the InfluxDB storage

        Args:
            dataset_id (str): The dataset identifier

        Returns:
            dict: The dataset description
        """
        datasets = await self.get_datasets()
        for sensor in datasets.sensors:
            if sensor.name == name:
                if sensor.db_spec:
                    try:
                        return await self.get_dataset_from_db(
                            sensor, from_date, to_date, allow_resample
                        )
                    except Exception as e:
                        logger.error(
                            f"Error while getting dataset from InfluxDB: {e}"
                        )
                        if sensor.file_spec:
                            logger.warning(
                                "Getting dataset from file:"
                                f" {sensor.file_spec.file}"
                            )
                            return await self.get_dataset_from_file(
                                datasets,
                                sensor,
                                from_date,
                                to_date,
                                allow_resample,
                            )
                elif sensor.file_spec:
                    return await self.get_dataset_from_file(
                        datasets, sensor, from_date, to_date, allow_resample
                    )
        raise HTTPException(status_code=404, detail="Sensor not found")

    async def get_dataset_from_file(
        self,
        datasets: Datasets,
        sensor: SensorDataSpec,
        from_date: datetime.datetime = None,
        to_date: datetime.datetime = None,
        allow_resample=True,
    ) -> SensorData:
        file_specs = self.get_file_specs(datasets, sensor.file_spec.file)
        df = await self.read_dataset_file(file_specs)
        for column in sensor.file_spec.columns:
            if column.name in df.columns:
                if column.measure == "timestamp":
                    df[column.name] = pd.to_datetime(
                        df[column.name], format=column.format
                    )
                    df.drop_duplicates(subset=column.name, inplace=True)
                    df.set_index(column.name, drop=False, inplace=True)
                    df.sort_index(inplace=True)
                elif df[column.name].dtype == "object":
                    df[column.name] = (
                        df[column.name].str.replace(",", ".").astype("float")
                    )
                    if column.min is not None or column.max is not None:
                        df[column.name] = df[column.name].where(
                            ((column.min is None) or (df[column.name] >= column.min)) &
                            ((column.max is None) or (
                                df[column.name] <= column.max))
                        )

        # remove columns that are not in the file
        df = df[
            [
                column.name
                for column in sensor.file_spec.columns
                if column.name in df.columns
            ]
        ]

        if (from_date is None or to_date is None) and allow_resample:
            # no (or partial) time range defined: sample per hour mean
            df = df.resample(sensor.file_spec.aggregate).mean()
        else:
            # if the time range is less than a threshold,
            # keep the original data
            from_date_range = self.get_nearest_timestamp(df, from_date)
            to_date_range = self.get_nearest_timestamp(df, to_date)
            try:
                df = df[from_date_range:to_date_range]
            except KeyError:
                logger.error(
                    "Error while filtering the dataset:"
                    f" {sensor.name} {from_date_range} - {to_date_range}"
                )
            if (
                self.to_resample(from_date_range, to_date_range)
                and allow_resample
            ):
                df = df.resample(sensor.file_spec.aggregate).mean()
        df = df.replace({np.nan: None})

        vectors = []
        for column in sensor.file_spec.columns:
            if column.name in df.columns:
                if column.measure == "timestamp":
                    vectors.append(
                        Vector(
                            measure=column.measure,
                            values=df[column.name].astype(str).tolist(),
                        )
                    )
                else:
                    vectors.append(
                        Vector(
                            measure=column.measure,
                            values=df[column.name].tolist(),
                        )
                    )
        return SensorData(name=sensor.name, vectors=vectors)

    async def get_dataset_from_db(
        self,
        sensor: SensorDataSpec,
        from_date: datetime.datetime = None,
        to_date: datetime.datetime = None,
        allow_resample=True,
    ) -> SensorData:
        from_datetime = from_date if from_date else START_DATETIME
        to_datetime = to_date if to_date else datetime.datetime.now()

        query = DBUnionQuery()

        to_date_str = to_date if to_date else "now()"
        for filter in sensor.db_spec.filters.measures:
            # create a query for each filter
            q = DBQuery(
                filter.measure,
                sensor.db_spec.measurement,
                from_datetime,
                to_date_str,
            )\
                .filter(sensor.db_spec.location.field,
                        sensor.db_spec.location.value)\
                .filter(sensor.db_spec.filters.field, filter.value)\
                .min_max(filter.min, filter.max)
            if self.to_resample(from_datetime, to_datetime) and allow_resample:
                q.aggregate(sensor.db_spec.aggregate, "mean")

            query.add_query(q)

        content = await redis.get(query.to_string())
        vectors = []
        if not content:
            logger.info(
                "Query result not found in cache, getting it from InfluxDB:"
                f" {query.to_string()}"
            )
            time, value, measure = db_client.execute(
                query.to_string(), sensor.db_spec.filters
            )
            # transpose long to wide format
            df = pd.DataFrame(
                {"timestamp": time, "value": value, "measure": measure}
            )
            # sort by timestamp, measure and value so that the duplicate with
            # non value is kept
            df = df.sort_values(
                by=["timestamp", "measure", "value"],
                key=lambda col: col.isnull(),
            )
            df = df.drop_duplicates(subset=["timestamp", "measure"])
            df = df.pivot(index="timestamp", columns="measure", values="value")
            df = df.reset_index()
            df = df.replace({np.nan: None})
            vectors = [
                Vector(
                    measure="timestamp",
                    values=[
                        t.strftime("%Y-%m-%d %H:%M:%S")
                        for t in df["timestamp"].tolist()
                    ],
                ),
            ]
            for column in df.columns:
                if column != "timestamp":
                    vectors.append(
                        Vector(measure=column, values=df[column].tolist())
                    )
            await redis.set(
                query.to_string(),
                json.dumps([vector.model_dump() for vector in vectors]),
                ex=config.CACHE_SOURCE_EXPIRY,
            )
        else:
            vectors = [
                Vector(**vector_dict) for vector_dict in json.loads(content)
            ]

        if sensor.name == "C3":
            await self.rescale_precipitation(vectors)

        if sensor.name == "C2":
            vectors.append(await self.compute_flow(vectors))

        return SensorData(name=sensor.name, vectors=vectors)

    def to_resample(
        self, from_date: datetime.datetime, to_date: datetime.datetime
    ):
        difference = to_date - from_date
        hours_difference = difference.total_seconds() / 3600
        return hours_difference > config.RESAMPLE_THRESHOLD

    def get_nearest_timestamp(
        self, df: pd.DataFrame, timestamp: datetime.datetime
    ):
        if timestamp in df.index:
            return timestamp
        else:
            # Find the index position of the nearest date
            idx_pos = df.index.get_indexer([timestamp], method="nearest")[0]
            nearest_date = df.index[idx_pos]
            return nearest_date

    def get_file_specs(self, datasets: Datasets, name: str) -> DatasetFile:
        """Get the file specs from the S3 storage

        Args:
            file_path (str): The file path

        Returns:
            dict: The file specs
        """
        for file in datasets.files:
            if file.file == name:
                return file
        raise HTTPException(
            status_code=404, detail=f"File specs not found: {name}"
        )

    async def read_dataset_file_concurrently(
        self, dataset_file: DatasetFile
    ) -> pd.DataFrame:
        if await lock.acquire():
            try:
                return await self.read_dataset_file(dataset_file)
            finally:
                await lock.release()
        else:
            return await self.read_dataset_file(dataset_file)

    async def read_dataset_file(
        self, dataset_file: DatasetFile
    ) -> pd.DataFrame:
        file_path = f"timeseries/{dataset_file.file}"
        # Retrieve the content of data file and cache it
        content = await redis.get(file_path)
        if not content:
            logger.info(
                f"File not found in cache, getting it from S3: {file_path}"
            )
            content, mime_type = await s3_client.get_file(file_path)
            # check content is not False
            if not content:
                raise HTTPException(
                    status_code=404,
                    detail=f"File not found: {s3_client.to_s3_key(file_path)}",
                )
            await redis.set(file_path, content, ex=config.CACHE_SOURCE_EXPIRY)
        df = pd.read_csv(
            io.BytesIO(content),
            sep=dataset_file.separator,
            skiprows=dataset_file.skip,
        )

        return df

    async def rescale_precipitation(self, vectors: list[Vector]) -> None:
        for vector in vectors:
            if vector.measure == "precipitation":
                vector.values = [
                    (float(v) / 5 if v is not None else None)
                    for v in vector.values
                ]

    async def compute_flow(self, vectors: list[Vector]) -> Vector:
        vector_map = {vector.measure: vector.values for vector in vectors}
        water_level = np.array(vector_map["water_level"], dtype=float)
        water_level = np.nan_to_num(water_level, 0)

        Qp = np.zeros_like(water_level)
        D = 1.25  # pipe diameter [m]
        ks = 4 / 1000  # roughness coefficient [m]
        phi = 2 * np.pi - 2 * np.arccos((water_level / 1000 - D / 2) / (D / 2))
        Ap = (phi - np.sin(phi)) / (2 * np.pi)
        with np.errstate(divide="ignore", invalid="ignore"):
            Rp = 1 - np.sin(phi) / phi
        Qp = np.nan_to_num(
            (1 + np.log(Rp) / np.log(3.7 * D / ks)) * Ap * Rp**0.5, nan=0
        )

        # Convert flow from m³/s to L/s
        Qp = Qp * 1000

        return Vector(measure="outflow_total", values=Qp.tolist())
