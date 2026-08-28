from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str
    service: str
    models_loaded: bool
    current_scenario: str
    total_events_loaded: int
    environment: str

class StageMetrics(BaseModel):
    stage: str
    stage_order: int
    bottleneck_score: float
    severity: str
    health: str
    mean_duration: float
    median_duration: float
    p95_duration: float
    sla_target: float
    sla_violation_rate: float
    sla_violations_count: int
    mean_queue_time: float
    mean_processing_time: float
    queue_ratio: float
    resource_utilization: float
    throughput_per_hr: float
    delay_contribution_pct: float
    anomaly_rate_pct: float
    evidence: List[str]

class ProcessOverview(BaseModel):
    scenario: str
    total_events: int
    total_cases: int
    avg_process_lead_time: float
    p95_process_lead_time: float
    overall_sla_compliance_rate: float
    overall_anomaly_rate: float
    primary_bottleneck_stage: str
    primary_bottleneck_severity: str
    stages: List[StageMetrics]

class ScenarioInjectRequest(BaseModel):
    scenario: str = Field(..., description="Scenario name: normal, payment_verification_bottleneck, packing_bottleneck, unknown_inventory_bottleneck")
    seed: Optional[int] = 42

class ScenarioInjectResponse(BaseModel):
    success: bool
    scenario: str
    message: str
    events_count: int
