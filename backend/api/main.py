import os
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from api.config import config
from logging import basicConfig, INFO
from pydantic import BaseModel
from api.views.files import router as files_router
from api.views.measures import router as measures_router

basicConfig(level=INFO)

app = FastAPI(root_path=config.PATH_PREFIX)

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
async def get_health(
) -> HealthCheck:
    return HealthCheck(status="OK")

app.include_router(
    files_router,
    prefix="/files",
    tags=["Files"],
)

app.include_router(
    measures_router,
    prefix="/measures",
    tags=["Measures"],
)
