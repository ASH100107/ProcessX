from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class SimulateRequest(BaseModel):
    intervention_id: str
    custom_cost: Optional[float] = None

class OptimizeRequest(BaseModel):
    monthly_budget: Optional[float] = 12000.0
    max_interventions: Optional[int] = 3
    enforce_single_per_stage: Optional[bool] = True

class InvestigationStartRequest(BaseModel):
    scenario: Optional[str] = None
    monthly_budget: Optional[float] = 12000.0

class ReEvaluateRequest(BaseModel):
    applied_intervention_id: str
