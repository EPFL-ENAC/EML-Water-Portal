import io
import json
import pkg_resources
from api.services.s3 import s3_client
from fastapi.exceptions import HTTPException
from api.models.measures import Datasets, SensorData, DatasetFile
import pandas as pd
import numpy as np
from fastapi.logger import logger
from api.config import config, redis

lock = redis.lock("s3_measures", timeout=10)


class MeasuresService:

    async def get_datasets(self) -> Datasets:
        """Get the datasets from the S3 storage

        Returns:
            Datasets: The datasets description
        """
        data_file_path = pkg_resources.resource_filename(
            "api", "data/datasets.json")
        with open(data_file_path) as f:
            datasets_dict = json.load(f)
            return Datasets(**datasets_dict)
        return Datasets()

    async def get_dataset(self, name: str, from_date=None, to_date=None) -> SensorData:
        """Get a dataset from the S3 storage

        Args:
            dataset_id (str): The dataset identifier

        Returns:
            dict: The dataset description
        """
        datasets = await self.get_datasets()
        for sensor in datasets.sensors:
            if sensor.name == name:
                file_specs = self.get_file_specs(datasets, sensor.file)
                df = await self.read_dataset_file_concurrently(file_specs)
                for column in sensor.columns:
                    if column.name in df.columns:
                        if column.measure == "timestamp":
                            df[column.name] = pd.to_datetime(
                                df[column.name], format=column.format)
                            df.set_index(column.name, drop=False, inplace=True)
                        elif df[column.name].dtype == 'object':
                            df[column.name] = df[column.name].str.replace(
                                ',', '.').astype('float')

                if from_date is None or to_date is None:
                    # no (or partial) time range defined: sample per hour mean
                    df = df.resample('h').mean()
                else:
                    # if the time range is less than a threshold, keep the original data
                    df = df[from_date:to_date]
                    difference = to_date - from_date
                    hours_difference = difference.total_seconds() / 3600
                    if hours_difference > config.RESAMPLE_THRESHOLD:
                        df = df.resample('h').mean()
                df = df.replace({np.nan: None})

                vectors = []
                for column in sensor.columns:
                    if column.name in df.columns:
                        if column.measure == "timestamp":
                            vectors.append({
                                "measure": column.measure,
                                "values": df[column.name].astype(str).tolist()
                            })
                        else:
                            vectors.append({
                                "measure": column.measure,
                                "values": df[column.name].tolist()
                            })
                return SensorData(name=sensor.name, vectors=vectors)
        raise HTTPException(status_code=404,
                            detail="Sensor not found")

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
        raise HTTPException(status_code=404,
                            detail=f"File specs not found: {name}")

    async def read_dataset_file_concurrently(self, dataset_file: DatasetFile) -> pd.DataFrame:
        if await lock.acquire():
            try:
                return await self.read_dataset_file(dataset_file)
            finally:
                await lock.release()
        else:
            return await self.read_dataset_file(dataset_file)

    async def read_dataset_file(self, dataset_file: DatasetFile) -> pd.DataFrame:
        file_path = f"timeseries/{dataset_file.file}"
        # Retrieve the content of data file and cache it
        content = await redis.get(file_path)
        if not content:
            logger.info(
                f"File not found in cache, getting it from S3: {file_path}")
            content, mime_type = await s3_client.get_file(file_path)
            # check content is not False
            if not content:
                raise HTTPException(status_code=404,
                                    detail=f"File not found: {s3_client.to_s3_key(file_path)}")
            await redis.set(file_path, content, ex=config.CACHE_SOURCE_EXPIRY)
        df = pd.read_csv(io.BytesIO(
            content), sep=dataset_file.separator, skiprows=dataset_file.skip)

        return df
