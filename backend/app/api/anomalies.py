from fastapi import APIRouter
from typing import Dict, Any
from backend.app.services.process_service import process_service

router = APIRouter(tags=["Anomalies"])

@router.get("/anomalies")
async def get_anomalies() -> Dict[str, Any]:
    """Retrieve Isolation Forest anomaly scores, rates per stage, and anomalous event samples."""
    return process_service.get_anomalies()
