from fastapi import APIRouter
from typing import Dict, Any
from backend.app.services.process_service import process_service

router = APIRouter(tags=["Baseline Comparison"])

@router.get("/baseline/comparison")
async def get_baseline_comparison() -> Dict[str, Any]:
    """
    Compare Naive Fixed-Rule Baseline (Highest Mean Duration) vs ProcessX Multi-Signal Agent.
    Evaluates bottleneck discovery accuracy, cost efficiency, SLA recovery, and net ROI.
    """
    return process_service.get_baseline_comparison()
