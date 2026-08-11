from fastapi import APIRouter

from app.api.v1.endpoints.analytics import router as analytics_router
from app.api.v1.endpoints.chat import router as chat_router
from app.api.v1.endpoints.crop_explanation import router as crop_explanation_router
from app.api.v1.endpoints.crop_profiles import router as crop_profiles_router
from app.api.v1.endpoints.crop_suggestion import router as crop_suggestion_router
from app.api.v1.endpoints.crop_suitability import router as crop_suitability_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.location_weather import router as location_weather_router
from app.api.v1.endpoints.ndvi import router as ndvi_router
from app.api.v1.endpoints.regions import router as regions_router

api_router = APIRouter()
api_router.include_router(analytics_router)
api_router.include_router(chat_router)
api_router.include_router(crop_explanation_router)
api_router.include_router(crop_profiles_router)
api_router.include_router(crop_suggestion_router)
api_router.include_router(crop_suitability_router)
api_router.include_router(health_router)
api_router.include_router(location_weather_router)
api_router.include_router(ndvi_router)
api_router.include_router(regions_router)
