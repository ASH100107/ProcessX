from fastapi import APIRouter
from typing import Dict, Any
from backend.app.services.process_service import process_service

router = APIRouter(tags=["Delay Causes"])

@router.get("/delay-causes")
async def get_delay_causes() -> Dict[str, Any]:
    """Retrieve ML-predicted delay cause distribution and confidence breakdown per stage."""
    return process_service.get_delay_causes()
