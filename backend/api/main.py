from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from logging import INFO, basicConfig

from api.cache import redis
from api.config import config
from api.views.design import router as design_router
from api.views.measures import router as measures_router
from api.views.scenarii import router as scenarii_router
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from pydantic import BaseModel

basicConfig(level=INFO)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    FastAPICache.init(RedisBackend(redis), prefix="wp-cache")
    yield


app = FastAPI(root_path=config.PATH_PREFIX, lifespan=lifespan)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthCheck(BaseModel):
    """Response model to validate and return when performing a health check."""

    status: str = "OK"


@app.get(
    "/healthz",
    tags=["Healthcheck"],
    summary="Perform a Health Check",
    response_description="Return HTTP Status Code 200 (OK)",
    status_code=status.HTTP_200_OK,
    response_model=HealthCheck,
)
async def get_health() -> HealthCheck:
    return HealthCheck(status="OK")


app.include_router(
    measures_router,
    prefix="/measures",
    tags=["Measures"],
)

app.include_router(
    scenarii_router,
    prefix="/scenarii",
    tags=["Scenarios"],
)

app.include_router(
    design_router,
    prefix="/design",
    tags=["Design"],
)
