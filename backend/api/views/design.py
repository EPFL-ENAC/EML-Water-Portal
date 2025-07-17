from api.models.design import DesignData
from api.services.design import DesignService
from fastapi import APIRouter

router = APIRouter()


@router.get("/{watershed}", response_model=DesignData)
async def get_design_data(
    watershed: str,
) -> DesignData:
    """Get design data for a given watershed."""

    service = DesignService()
    return await service.get_design_data(watershed)
