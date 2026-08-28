from fastapi import APIRouter
from typing import List, Dict, Any
from backend.app.services.process_service import process_service

router = APIRouter(tags=["Bottlenecks"])

@router.get("/bottlenecks")
async def get_bottlenecks() -> List[Dict[str, Any]]:
    """Retrieve ranked stage bottlenecks with multi-signal scores and evidence."""
    return process_service.get_bottlenecks()
