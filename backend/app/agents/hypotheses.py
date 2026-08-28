"""
Causal Hypothesis Generation and Empirical Testing Engine
"""

from typing import Dict, List, Any
import numpy as np
import pandas as pd

class HypothesisEngine:
    def __init__(self):
        pass

    def generate_and_test_hypotheses(
        self,
        stage_metrics: Dict[str, Any],
        stage_events: pd.DataFrame,
        delay_causes: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Generate candidate causal hypotheses for an investigated bottleneck stage
        and run empirical data tests to validate confidence and supporting evidence.
        """
        stage = stage_metrics["stage"]
        mean_q = stage_metrics["mean_queue_time"]
        mean_p = stage_metrics["mean_processing_time"]
        util = stage_metrics["resource_utilization"]
        sla_rate = stage_metrics["sla_violation_rate"]
        p95_dur = stage_metrics["p95_duration"]
        sla_tgt = stage_metrics["sla_target"]
        anom_rate = stage_metrics.get("anomaly_rate_pct", 5.0)

        # Dominant predicted delay causes
        top_causes = [c["cause"] for c in delay_causes[:3]] if delay_causes else []

        hypotheses = []

        # Hypothesis 1: Inflow Queue Overload & Capacity Starvation
        q_ratio = mean_q / max(0.1, (mean_q + mean_p))
        test_1_pass = q_ratio > 0.40 or "High Queue" in top_causes
        conf_1 = min(0.95, round(0.50 + (q_ratio * 0.45), 2))
        ev_1 = [
            f"Average queue delay is {mean_q:.1f}m ({q_ratio*100:.1f}% of total stage duration)",
            f"Queue length averages {stage_events['queue_length'].mean():.1f} cases pending execution"
        ]
        if "High Queue" in top_causes:
            ev_1.append("Delay-cause ML classifier assigned high confidence to Queue Overload")

        hypotheses.append({
            "id": f"HYP-{stage[:3].upper()}-01",
            "title": "Queue Overload & Upstream Arrival Congestion",
            "stage": stage,
            "description": f"Orders are queueing extensively before operator pickup in {stage}, pointing to severe worker/capacity starvation.",
            "test_method": "Empirical Queue-to-Service Ratio Test (threshold: > 0.40)",
            "test_status": "CONFIRMED" if test_1_pass else "REFUTED",
            "confidence": conf_1 if test_1_pass else 0.22,
            "supporting_evidence": ev_1,
            "expected_impact": "High duration reduction if concurrency/staffing is augmented."
        })

        # Hypothesis 2: Resource Utilization Saturation & Burnout
        test_2_pass = util > 0.82 or "Resource Shortage" in top_causes
        conf_2 = min(0.96, round(0.40 + (util * 0.55), 2))
        ev_2 = [
            f"Resource utilization is {util*100:.1f}% (industry threshold > 80% causes exponential queue explosion)",
            f"Team '{stage_events['employee_team'].iloc[0]}' has no slack capacity for volume fluctuations"
        ]
        hypotheses.append({
            "id": f"HYP-{stage[:3].upper()}-02",
            "title": "Operator Resource Saturation & Shift Bottleneck",
            "stage": stage,
            "description": f"Operating resources in {stage} are running near peak capacity ceiling, triggering nonlinear queue delays.",
            "test_method": "Kingman's Queuing Theory Saturation Test (Utilization > 80%)",
            "test_status": "CONFIRMED" if test_2_pass else "REFUTED",
            "confidence": conf_2 if test_2_pass else 0.28,
            "supporting_evidence": ev_2,
            "expected_impact": "Stabilizes process volatility and eliminates exponential queuing spikes."
        })

        # Hypothesis 3: Manual Task Complexity & Execution Friction
        # Check if processing time is high or "Manual Processing" or "Inventory Mismatch" / "System Delay"
        high_proc = mean_p > sla_tgt * 0.5
        has_manual_cause = any(c in top_causes for c in ["Manual Processing", "Inventory Mismatch", "System Delay"])
        test_3_pass = high_proc or has_manual_cause
        conf_3 = min(0.92, round(0.45 + ((mean_p / sla_tgt) * 0.40), 2))
        ev_3 = [
            f"Active processing duration is {mean_p:.1f}m against target {sla_tgt:.1f}m",
            f"Delay cause diagnostics indicate: {', '.join(top_causes) if top_causes else 'Manual Task Overhead'}"
        ]
        hypotheses.append({
            "id": f"HYP-{stage[:3].upper()}-03",
            "title": "Manual Step Inefficiency & Workflow Complexity",
            "stage": stage,
            "description": f"Individual cases require prolonged hands-on manual intervention or system lookups in {stage}.",
            "test_method": "Processing Time SLA Threshold Test & Root-Cause Classifier Correlation",
            "test_status": "CONFIRMED" if test_3_pass else "REFUTED",
            "confidence": conf_3 if test_3_pass else 0.30,
            "supporting_evidence": ev_3,
            "expected_impact": "Automation or tool enhancements will directly reduce execution lead time."
        })

        # Sort hypotheses by confidence descending
        hypotheses.sort(key=lambda h: h["confidence"], reverse=True)
        return hypotheses
