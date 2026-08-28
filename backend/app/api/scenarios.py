from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from backend.app.schemas.process import ScenarioInjectRequest, ScenarioInjectResponse
from backend.app.services.process_service import process_service

router = APIRouter(tags=["Scenarios"])

SCENARIOS_META = [
    {
        "id": "normal",
        "name": "Normal Baseline Process",
        "description": "Stable operation across all 6 stages. SLA compliance > 96%, minimal queueing.",
        "difficulty": "Control Baseline",
        "primary_stage": "None"
    },
    {
        "id": "payment_verification_bottleneck",
        "name": "Payment Verification Bottleneck",
        "description": "Fraud review backlog, surging queue times (>20m), SLA violation rate > 38%.",
        "difficulty": "Scenario 1",
        "primary_stage": "Payment Verification"
    },
    {
        "id": "packing_bottleneck",
        "name": "Order Packing Bottleneck",
        "description": "Physical fulfillment station saturation, packaging shortage, high variance, SLA violation rate > 42%.",
        "difficulty": "Scenario 2",
        "primary_stage": "Order Packing"
    },
    {
        "id": "unknown_inventory_bottleneck",
        "name": "Unknown / Dynamic Inventory Bottleneck",
        "description": "Unannounced barcode scanner desync and inventory stock discrepancies in Inventory Check.",
        "difficulty": "Autonomous Generalization Test",
        "primary_stage": "Inventory Check"
    }
]

@router.get("/scenario/list")
async def list_scenarios() -> List[Dict[str, Any]]:
    """List available business process scenarios for simulation and testing."""
    return SCENARIOS_META

@router.post("/scenario/inject", response_model=ScenarioInjectResponse)
async def inject_scenario(req: ScenarioInjectRequest):
    """
    Inject a process scenario into the running system.
    Dynamically swaps event logs and resets telemetry.
    """
    valid_ids = [s["id"] for s in SCENARIOS_META]
    if req.scenario not in valid_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario '{req.scenario}'. Must be one of: {', '.join(valid_ids)}"
        )
    
    df = process_service.load_scenario(req.scenario)
    return ScenarioInjectResponse(
        success=True,
        scenario=req.scenario,
        message=f"Successfully injected scenario '{req.scenario}'. Process state updated.",
        events_count=len(df)
    )
