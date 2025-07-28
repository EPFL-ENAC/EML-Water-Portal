import io

import pandas as pd
from api.cache import redis
from api.config import config
from api.models.design import DesignCurve, DesignData
from api.services.s3 import s3_client
from fastapi.exceptions import HTTPException
from fastapi.logger import logger


class DesignService:
    async def read_design_file(self) -> pd.DataFrame:
        file_path = "design.csv"
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
        )
        df = df.set_index(["watershed", "type", "label"])

        return df

    async def get_watersheds(self) -> list[str]:
        df = await DesignService().read_design_file()
        watersheds = df.index.get_level_values("watershed").unique()
        return list(watersheds)

    async def get_design_data(self, watershed: str) -> DesignData:
        df = await DesignService().read_design_file()
        watersheds = df.index.get_level_values("watershed").unique()

        if watershed not in watersheds:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Watershed not found: {watershed}, must be one of:"
                    f" {', '.join(watersheds)}"
                ),
            )

        df = df.loc[watershed]
        types = df.index.get_level_values("type").unique()
        design_data = {}

        for type_ in types:
            labels = df.loc[type_].index.get_level_values("label").unique()
            design_data[type_] = []

            for label in labels:
                curve = df.loc[type_, label]
                design_curve = DesignCurve(
                    x=curve["x"].tolist(), y=curve["y"].tolist(), label=label
                )
                design_data[type_].append(design_curve)

        return DesignData(**design_data)
