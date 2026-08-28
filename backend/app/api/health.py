from fastapi import APIRouter
from backend.app.schemas.process import HealthResponse
from backend.app.services.ml_service import ml_service
from backend.app.services.process_service import process_service
from backend.app.utils.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """System health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="processx-backend",
        models_loaded=ml_service.models_loaded,
        current_scenario=process_service.current_scenario,
        total_events_loaded=len(process_service.current_df) if process_service.current_df is not None else 0,
        environment=settings.ENVIRONMENT
    )
