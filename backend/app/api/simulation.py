from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from backend.app.schemas.intervention import SimulateRequest, OptimizeRequest, ReEvaluateRequest
from backend.app.services.process_service import process_service
from backend.app.simulation.interventions import get_all_interventions

router = APIRouter(tags=["Simulation & Optimization"])

@router.get("/interventions/catalog")
async def get_catalog() -> List[Dict[str, Any]]:
    """Retrieve catalog of candidate operational interventions."""
    return get_all_interventions()

@router.post("/interventions/simulate")
async def simulate_intervention(req: SimulateRequest) -> Dict[str, Any]:
    """
    Simulate applying an intervention to the active process dataset.
    Returns Before vs After metrics, SLA impact, financial benefit, and ROI.
    """
    try:
        sim_res = process_service.simulation_engine.simulate_intervention(
            df=process_service.current_df,
            intervention_id=req.intervention_id,
            custom_cost=req.custom_cost
        )
        # Exclude internal dataframe from JSON response
        return {k: v for k, v in sim_res.items() if k != "simulated_dataframe"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/interventions/optimize")
async def optimize_portfolio(req: OptimizeRequest = OptimizeRequest()) -> Dict[str, Any]:
    """
    Run OR-Tools mathematical optimization across all candidate interventions
    to maximize net monthly benefit subject to budget and concurrency constraints.
    """
    try:
        all_ints = get_all_interventions()
        sim_results = [
            process_service.simulation_engine.simulate_intervention(process_service.current_df, i["id"])
            for i in all_ints
        ]
        portfolio = process_service.roi_optimizer.optimize_portfolio(
            simulation_results=sim_results,
            monthly_budget=req.monthly_budget or 12000.0,
            max_interventions=req.max_interventions or 3,
            enforce_single_per_stage=req.enforce_single_per_stage if req.enforce_single_per_stage is not None else True
        )
        return portfolio
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/re-evaluate")
async def re_evaluate_process(req: ReEvaluateRequest) -> Dict[str, Any]:
    """
    Apply intervention to process state, recalculate all stage metrics,
    and detect if the original bottleneck improved or transferred to another stage.
    """
    try:
        return process_service.re_evaluate_process(req.applied_intervention_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
