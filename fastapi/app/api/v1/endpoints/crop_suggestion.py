from fastapi import APIRouter, HTTPException, status

from app.ml.plant_recommender import (
    PlantDatasetUnavailableError,
    recommend_crops,
    recommend_plants,
    search_crop_requirements,
)
from app.schemas.crop_suggestion import (
    CropRequirement,
    CropSuggestionRequest,
    CropSuggestionResponse,
    PlantSuggestionRequest,
    PlantSuggestionResponse,
)
from app.services.market_prices import (
    MarketPriceDatasetUnavailableError,
    market_price_summary,
)

router = APIRouter(tags=["crop-suggestion"])


@router.get(
    "/crop-requirements",
    response_model=list[CropRequirement],
    summary="Search crop growing requirements",
)
def crop_requirements(
    query: str = "",
    language: str = "en",
    limit: int = 10,
) -> list[dict[str, object]]:
    return search_crop_requirements(query, language=language, limit=min(max(limit, 1), 100))


@router.post(
    "/crop-suggestion",
    response_model=CropSuggestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict the best crop for current conditions",
)
def crop_suggestion(request: CropSuggestionRequest) -> CropSuggestionResponse:
    try:
        recommendations = recommend_crops(
            request.soil_ph,
            request.rainfall_mm,
            request.temperature_c,
            field_area_acres=request.field_area_acres,
            admin1=request.admin1,
            admin2=request.admin2,
            humidity_pct=request.humidity_pct,
            language=request.language,
            limit=3,
        )
    except PlantDatasetUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    if not recommendations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No recommended crops currently have an available market price.",
        )

    primary = recommendations[0]
    return CropSuggestionResponse(
        crop=str(primary["name"]),
        confidence_percent=float(primary["match_score"]),
        recommendations=[
            {
                "crop": recommendation["name"],
                "crop_key": recommendation["name_en"],
                "suitability_percent": recommendation["match_score"],
                "market_price_mmk_per_kg": recommendation[
                    "market_price_mmk_per_kg"
                ],
                "description": recommendation["description"],
                "market_price_source": recommendation.get("market_price_source"),
                "market_price_observed_date": recommendation.get("market_price_observed_date"),
                "market_name": recommendation.get("market_name"),
                "market_price_is_dynamic": recommendation.get("market_price_is_dynamic", False),
                "water_need_liters_per_day": None,
                "sunlight": recommendation.get("sunlight"),
                "growth_period_years": recommendation.get("growth_period_years"),
            }
            for recommendation in recommendations
        ],
    )


@router.post(
    "/plant-suggestions",
    response_model=PlantSuggestionResponse,
    summary="Recommend plants from the plants dataset",
)
def plant_suggestions(request: PlantSuggestionRequest) -> PlantSuggestionResponse:
    try:
        recommendations = recommend_plants(
            request.soil_ph,
            request.rainfall_mm,
            request.temperature_c,
            request.field_area_acres,
            language=request.language,
        )
    except PlantDatasetUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    return PlantSuggestionResponse(recommendations=recommendations)


@router.get(
    "/crop-market-prices",
    summary="List the newest available WFP crop prices",
)
def crop_market_prices(
    admin1: str | None = None,
    admin2: str | None = None,
) -> list[dict[str, object]]:
    try:
        return market_price_summary(admin1=admin1, admin2=admin2)
    except MarketPriceDatasetUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
