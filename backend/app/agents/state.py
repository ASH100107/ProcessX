"""
Investigation State and Data Models
"""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class TimelineStep(BaseModel):
    step_number: int
    phase: str
    title: str
    detail: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    data: Optional[Dict[str, Any]] = None

class InvestigationResult(BaseModel):
    investigation_id: str
    scenario: str
    timestamp: str
    abnormal_behavior_detected: bool
    selected_stage: str
    selection_reason: str
    target_evidence: List[str]
    hypotheses: List[Dict[str, Any]]
    simulations: List[Dict[str, Any]]
    optimized_portfolio: Dict[str, Any]
    recommended_action: Dict[str, Any]
    re_evaluation: Dict[str, Any]
    timeline: List[TimelineStep]
