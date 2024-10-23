from pydantic_settings import BaseSettings
from functools import lru_cache
from redis import asyncio as aioredis


class Config(BaseSettings):

    PATH_PREFIX: str = "/api"

    # Keycloak
    KEYCLOAK_REALM: str = "EML"
    KEYCLOAK_URL: str = "https://enac-it-sso.epfl.ch"
    KEYCLOAK_API_ID: str
    KEYCLOAK_API_SECRET: str

    REDIS_URL: str = "redis://localhost"
    CACHE_API_EXPIRY: int = 60
    CACHE_SOURCE_EXPIRY: int = 600
    RESAMPLE_THRESHOLD: int = 7 * 24  # sample data when time range is above 7 days

    S3_ENDPOINT_PROTOCOL: str
    S3_ENDPOINT_HOSTNAME: str
    S3_ACCESS_KEY_ID: str
    S3_SECRET_ACCESS_KEY: str
    S3_REGION: str
    S3_BUCKET: str
    S3_PATH_PREFIX: str


@lru_cache()
def get_config():
    return Config()


config = get_config()
redis = aioredis.from_url(config.REDIS_URL)
