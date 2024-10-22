from typing import List, Optional, Tuple
from pydantic import BaseModel

class Column(BaseModel):
  name: str
  measure: str
  format: Optional[str] = None

class SensorData(BaseModel):
  name: str
  file: str
  columns: List[Column]

class DatasetFile(BaseModel):
  file: str
  skip: int
  separator: str

class Datasets(BaseModel):
  files: List[DatasetFile]
  sensors: List[SensorData]
