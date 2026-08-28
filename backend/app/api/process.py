from fastapi import APIRouter
from backend.app.schemas.process import ProcessOverview
from backend.app.services.process_service import process_service

router = APIRouter(tags=["Process"])

@router.get("/process/overview", response_model=ProcessOverview)
async def get_overview():
    """Retrieve end-to-end process lead times, SLA compliance, and bottleneck summary."""
    return process_service.get_overview()

@router.get("/process/map")
async def get_process_map():
    """Retrieve process graph nodes and connecting edges with real-time operational telemetry."""
    return process_service.get_process_map()

@router.get("/stages")
async def get_stages():
    """List all 6 process stages and baseline SLA targets."""
    return process_service.get_overview()["stages"]
