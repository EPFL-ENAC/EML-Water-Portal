from datetime import datetime

import eml_urban_hydro_model as uhm
import pandas as pd
from api.models.measures import Vector
from api.models.scenarii import ScenarioData
from api.services.measures import MeasuresService
from fastapi.exceptions import HTTPException


class ScenariiService:
    async def get_scenario_data(
        self,
        watershed: str,
        tank: float,
        roofToTank: float,
        vegetation: str,
        flushingFrequency: float,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
    ) -> ScenarioData:
        """Get simulated data for a scenario"""

        if watershed not in uhm.area_params:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Watershed not valid. Must be one of"
                    f" {', '.join(uhm.area_params.keys())}"
                ),
            )

        if vegetation not in uhm.vegetation_params:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Vegetation not valid. Must be one of"
                    f" {', '.join(uhm.vegetation_params.keys())}"
                ),
            )

        measures_service = MeasuresService()
        sensor_data = await measures_service.get_dataset(
            "C3", from_date, to_date
        )
        vector_map = {
            vector.measure: vector.values for vector in sensor_data.vectors
        }

        input_data = pd.DataFrame(
            {
                "time": pd.to_datetime(
                    vector_map["timestamp"], format="%Y-%m-%d %H:%M:%S"
                ),
                "precp": vector_map["water_level"],
            }
        )
        input_data["precp"] = input_data["precp"].astype(float)
        input_data = input_data.fillna(0)
        input_data = input_data.set_index("time", drop=True)
        # If needed, resample from hourly to 5 minutes, keeping constant values
        # during the hour
        input_data = input_data.resample("5min").ffill()
        input_data["time"] = input_data.index

        model_params = uhm.ModelParameters(
            area_params=uhm.area_params[watershed],
            Vmax=tank,
            frac_rt2tk=roofToTank,
            vegetation=uhm.vegetation_params[vegetation],
            flushingFrequency=flushingFrequency,
        )
        input_data = uhm.preprocess(input_data)
        output_data = uhm.model_st(input_data, model_params)

        output_vectors = [
            Vector(
                measure="timestamp",
                values=[
                    t.strftime("%Y-%m-%d %H:%M:%S") for t in output_data.index
                ],
            ),
            Vector(measure="water_level", values=input_data["precp"].tolist()),
            Vector(
                measure="outflow_total", values=output_data["Qout"].tolist()
            ),
            Vector(
                measure="outflow_road", values=output_data["Qroad"].tolist()
            ),
            Vector(
                measure="outflow_roof", values=output_data["Qroof"].tolist()
            ),
            Vector(
                measure="outflow_soil", values=output_data["Qsoil"].tolist()
            ),
            Vector(
                measure="outflow_tank", values=output_data["Qtank"].tolist()
            ),
        ]
        return ScenarioData(vectors=output_vectors)
