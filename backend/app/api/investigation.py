from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from backend.app.schemas.intervention import InvestigationStartRequest
from backend.app.services.process_service import process_service

router = APIRouter(tags=["Investigation"])

@router.post("/investigation/start")
async def start_investigation(req: InvestigationStartRequest = InvestigationStartRequest()) -> Dict[str, Any]:
    """
    Trigger full 14-step autonomous investigation state machine:
    Observe -> Detect -> Candidate Screening -> Stage Selection -> Evidence -> Hypotheses -> Testing -> Simulation -> OR-Tools ROI -> Action -> Re-Evaluation.
    """
    try:
        result = process_service.run_investigation(
            scenario=req.scenario,
            monthly_budget=req.monthly_budget or 12000.0
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/investigation/{inv_id}")
async def get_investigation(inv_id: str) -> Dict[str, Any]:
    """Retrieve full trace and artifacts for a specific investigation ID."""
    result = process_service.get_investigation_by_id(inv_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Investigation {inv_id} not found.")
    return result
