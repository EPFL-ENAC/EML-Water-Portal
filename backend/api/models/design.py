from pydantic import BaseModel

Watersheds = list[str]


class DesignCurve(BaseModel):
    x: list[float]
    y: list[float]
    label: str


class DesignData(BaseModel):
    tank_volume: list[DesignCurve]
    runoff_coefficient: list[DesignCurve]
    failure_rate: list[DesignCurve]
