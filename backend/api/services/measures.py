import json
from api.services.s3 import s3_client
from api.models.measures import Datasets


class MeasuresService:

    async def get_datasets(self) -> Datasets:
      """Get the datasets from the S3 storage

      Returns:
          Datasets: The datasets description
      """
      file_path = f"timeseries/datasets.json"
      content, mime_type = await s3_client.get_file(file_path)
      datasets_dict = json.loads(content)
      return Datasets(**datasets_dict)