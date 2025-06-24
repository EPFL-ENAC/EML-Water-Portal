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
        name: str,
        watershed: str,
        tank: float,
        roof_to_tank: float,
        vegetation: str,
        flushing_frequency: float,
        custom_percent_paved: float | None = None,
        use_historical_data: bool = False,
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

        if custom_percent_paved is not None and (
            custom_percent_paved < 0 or custom_percent_paved >= 100
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Custom percentage of paved area must be between 0 and"
                    " 100."
                ),
            )

        measures_service = MeasuresService()
        sensor_data = await measures_service.get_dataset(
            "10_years" if use_historical_data else "C3",
            from_date,
            to_date,
            False,
        )
        vector_map = {
            vector.measure: vector.values for vector in sensor_data.vectors
        }

        input_data = pd.DataFrame(
            {
                "time": pd.to_datetime(
                    vector_map["timestamp"], format="%Y-%m-%d %H:%M:%S"
                ),
                "precp": vector_map["precipitation"],
            }
        )
        input_data["precp"] = input_data["precp"].astype(float)
        input_data = input_data.fillna(0)
        input_data = input_data.set_index("time", drop=True)
        time_resolution_minutes = round(
            input_data.index.diff().mean().total_seconds() / 60
        )
        time_resolution_minutes = max(1, time_resolution_minutes)

        # Resample to ensure constant time resolution
        input_data = input_data.resample(
            f"{time_resolution_minutes}min"
        ).mean()
        input_data["time"] = input_data.index

        area_params = uhm.area_params[watershed]
        if custom_percent_paved is not None:
            area_params = uhm.set_percent_paved(
                area_params, percent_paved=custom_percent_paved
            )

        model_params = uhm.ModelParameters(
            area_params=area_params,
            Vmax=tank,
            frac_rt2tk=roof_to_tank,
            vegetation=uhm.vegetation_params[vegetation],
            flushing_frequency=flushing_frequency,
            resolution=time_resolution_minutes,
        )
        input_data = uhm.preprocess(input_data)
        output_data = uhm.model_st(input_data, model_params)

        # Convert flows from m³/s to L/s
        for col in ["Qout", "Qtank"]:
            if col in output_data:
                output_data[col] = output_data[col] * 1000

        output_vectors = [
            Vector(
                measure="timestamp",
                values=[
                    t.strftime("%Y-%m-%d %H:%M:%S") for t in output_data.index
                ],
            ),
            Vector(
                measure="outflow_total", values=output_data["Qout"].tolist()
            ),
            Vector(
                measure="outflow_tank", values=output_data["Qtank"].tolist()
            ),
            Vector(
                measure="soil_moisture",
                values=output_data["soil_mois"].tolist(),
            ),
            Vector(
                measure="volume_tank", values=output_data["v_tank"].tolist()
            ),
        ]
        return ScenarioData(
            name=f"{name} ({watershed})", vectors=output_vectors
        )
