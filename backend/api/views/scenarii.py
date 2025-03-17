from datetime import datetime

from api.config import config
from api.models.scenarii import ScenarioData
from api.services.scenarii import ScenariiService
from fastapi import APIRouter
from fastapi_cache.decorator import cache

router = APIRouter()


@router.get("/")
@cache(expire=config.CACHE_API_EXPIRY)
async def get_scenario_data(
    name: str,
    watershed: str,
    tank: float,
    roofToTank: float,
    vegetation: str,
    flushingFrequency: float,
    useHistoricalData: bool = False,
    start: str | None = None,
    end: str | None = None,
) -> ScenarioData:
    """Get simulated data for a scenario"""

    service = ScenariiService()
    from_date = (
        datetime.strptime(start, "%Y-%m-%dT%H:%M:%S.%fZ")
        if start is not None
        else None
    )
    to_date = (
        datetime.strptime(end, "%Y-%m-%dT%H:%M:%S.%fZ")
        if end is not None
        else None
    )

    return await service.get_scenario_data(
        name=name,
        watershed=watershed,
        tank=tank,
        roof_to_tank=roofToTank,
        vegetation=vegetation,
        flushing_frequency=flushingFrequency,
        use_historical_data=useHistoricalData,
        from_date=from_date,
        to_date=to_date,
    )
