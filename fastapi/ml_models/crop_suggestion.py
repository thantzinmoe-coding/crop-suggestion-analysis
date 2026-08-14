"""Backward-compatible wrapper for the active crop recommender.

The API now uses ``app.ml.plant_recommender`` directly.  This wrapper keeps
older scripts working while ensuring they also use crop_dataset.xls.
"""

from app.ml.plant_recommender import recommend_plants


def predict_crop(
    soil_pH: float,
    rainfall_mm: float,
    temperature_c: float,
    language: str = "en",
    field_area_acres: float = 1.0,
) -> list[dict[str, object]]:
    recommendations = recommend_plants(
        soil_pH,
        rainfall_mm,
        temperature_c,
        field_area_acres=field_area_acres,
        language=language,
        crop_only=True,
        limit=3,
    )
    return [
        {
            "name": recommendation["name"],
            "estimated_capacity": recommendation["estimated_capacity"],
            "match_score": recommendation["match_score"],
        }
        for recommendation in recommendations
    ]
