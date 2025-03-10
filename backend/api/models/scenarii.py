from api.models.measures import Vector
from pydantic import BaseModel


class ScenarioData(BaseModel):
    vectors: list[Vector]
