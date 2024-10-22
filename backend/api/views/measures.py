from typing import List
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from api.services.measures import MeasuresService
from api.models.measures import Datasets
from api.auth import require_admin, User

router = APIRouter()


@router.get("/datasets", response_model=Datasets)
async def get_datasets(
    #user: User = Depends(require_admin),
) -> Datasets:
    """Get all datasets"""
    service = MeasuresService()
    return await service.get_datasets()