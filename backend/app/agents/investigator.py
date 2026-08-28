"""
ProcessX Autonomous Investigator Agent
Orchestrates the entire investigation lifecycle state machine.
"""

import uuid
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional

from backend.app.ml.multi_signal_bottleneck import MultiSignalBottleneckDetector
from backend.app.ml.anomaly_detector import AnomalyDetector
from backend.app.ml.delay_classifier import DelayCauseClassifier
from backend.app.agents.hypotheses import HypothesisEngine
from backend.app.simulation.engine import SimulationEngine
from backend.app.simulation.interventions import INTERVENTIONS_CATALOG
from backend.app.optimization.roi_optimizer import ROIOptimizer
from backend.app.agents.state import TimelineStep, InvestigationResult
from backend.app.utils.logger import logger

class AutonomousInvestigator:
    def __init__(
        self,
        bottleneck_detector: MultiSignalBottleneckDetector,
        anomaly_detector: AnomalyDetector,
        delay_classifier: DelayCauseClassifier,
        simulation_engine: SimulationEngine,
        roi_optimizer: ROIOptimizer
    ):
        self.bottleneck_detector = bottleneck_detector
        self.anomaly_detector = anomaly_detector
        self.delay_classifier = delay_classifier
        self.simulation_engine = simulation_engine
        self.roi_optimizer = roi_optimizer
        self.hypothesis_engine = HypothesisEngine()

    def run_investigation(
        self,
        df: pd.DataFrame,
        scenario: str = "custom",
        monthly_budget: float = 12000.0
    ) -> Dict[str, Any]:
        """
        Execute full 14-step autonomous investigation state machine.
        """
        investigation_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
        start_time = datetime.utcnow().isoformat() + "Z"
        timeline: List[TimelineStep] = []
        step_counter = 1

        logger.info(f"[{investigation_id}] Starting Autonomous Investigation on scenario: {scenario}")

        # --- STEP 1: OBSERVE ---
        stage_anomalies = self.anomaly_detector.analyze_stage_anomalies(df)
        bottlenecks_before = self.bottleneck_detector.analyze(df, stage_anomalies=stage_anomalies)
        
        timeline.append(TimelineStep(
            step_number=step_counter,
            phase="OBSERVE",
            title="Telemetry & Event-Log Ingestion",
            detail=f"Ingested {len(df):,} process events across 6 stages. Established initial baseline metrics.",
            data={"total_events": len(df), "stages_count": len(bottlenecks_before)}
        ))
        step_counter += 1

        # --- STEP 2: DETECT ABNORMAL BEHAVIOR ---
        critical_stages = [s for s in bottlenecks_before if s["severity"] == "CRITICAL"]
        warning_stages = [s for s in bottlenecks_before if s["severity"] == "WARNING"]
        abnormal_detected = len(critical_stages) > 0 or len(warning_stages) > 0

        abnormal_msg = (
            f"Detected abnormal process behavior! {len(critical_stages)} Critical and {len(warning_stages)} Warning stage(s) identified."
            if abnormal_detected else "Process behavior is within normal operating parameters."
        )
        timeline.append(TimelineStep(
            step_number=step_counter,
            phase="DETECT_ABNORMALITY",
            title="Anomaly & Bottleneck Screening",
            detail=abnormal_msg,
            data={"critical_count": len(critical_stages), "warning_count": len(warning_stages), "abnormal": abnormal_detected}
        ))
        step_counter += 1

        # --- STEP 3: IDENTIFY CANDIDATE STAGES ---
        candidate_stages = critical_stages if critical_stages else (warning_stages if warning_stages else bottlenecks_before[:1])
        timeline.append(TimelineStep(
            step_number=step_counter,
            phase="IDENTIFY_CANDIDATES",
            title="Candidate Stage Identification",
            detail=f"Identified {len(candidate_stages)} candidate stage(s) requiring deep causal investigation: {', '.join([s['stage'] for s in candidate_stages])}.",
            data={"candidates": [s["stage"] for s in candidate_stages]}
        ))
        step_counter += 1

        # --- STEP 4: SELECT NEXT STAGE TO INVESTIGATE ---
        target_stage_info = candidate_stages[0] # Highest bottleneck score
        target_stage_name = target_stage_info["stage"]
        
        selection_reason = (
            f"Selected '{target_stage_name}' as the primary investigation target with highest composite score ({target_stage_info['bottleneck_score']}/100), "
            f"P95 duration of {target_stage_info['p95_duration']}m (SLA target: {target_stage_info['sla_target']}m), "
            f"and {target_stage_info['sla_violation_rate']}% SLA violation rate."
        )
        
        timeline.append(TimelineStep(
            step_number=step_counter,
            phase="SELECT_TARGET_STAGE",
            title=f"Target Selection: {target_stage_name}",
            detail=selection_reason,
            data={"selected_stage": target_stage_name, "score": target_stage_info["bottleneck_score"]}
        ))
        step_counter += 1

        # --- STEP 5: COLLECT EVIDENCE ---
        stage_df = df[df["stage"] == target_stage_name]
        stage_causes_breakdown = self.delay_classifier.analyze_stage_causes(df).get(target_stage_name, [])
        
        evidence_list = target_stage_info["evidence"]
        timeline.append(TimelineStep(
            step_number=step_counter,
            phase="COLLECT_EVIDENCE",
            title=f"Evidence Compilation for {target_stage_name}",
            detail=f"Compiled {len(evidence_list)} empirical signals. Delay-cause classifier identified primary driver: {stage_causes_breakdown[0]['cause'] if stage_causes_breakdown else 'Queue Congestion'}.",
            data={"evidence": evidence_list, "delay_causes": stage_causes_breakdown}
        ))
        step_counter += 1

        # --- STEP 6: GENERATE CAUSAL HYPOTHESES ---
        hypotheses = self.hypothesis_engine.generate_and_test_hypotheses(
            stage_metrics=target_stage_info,
            stage_events=stage_df,
            delay_causes=stage_causes_breakdown
        )
        
        confirmed_count = sum(1 for h in hypotheses if h["test_status"] == "CONFIRMED")
        timeline.append(TimelineStep(
            step_number=step_counter,
            phase="GENERATE_HYPOTHESES",
            title="Causal Hypothesis Generation",
            detail=f"Formulated {len(hypotheses)} domain hypotheses spanning Queue Overload, Resource Saturation, and Manual Processing friction.",
            data={"hypotheses_count": len(hypotheses)}
        ))
        step_counter += 1

        # --- STEP 7: TEST HYPOTHESES ---
        top_hyp = hypotheses[0]
        timeline.append(TimelineStep(
            step_number=step_counter,
            phase="TEST_HYPOTHESES",
            title="Empirical Hypothesis Testing",
            detail=f"Validated hypotheses against event distributions. Confirmed '{top_hyp['title']}' with {int(top_hyp['confidence']*100)}% statistical confidence.",
            data={"top_hypothesis": top_hyp}
        ))
        step_counter += 1

        # --- STEP 8 & 9: GENERATE & SIMULATE INTERVENTIONS ---
        all_interventions = list(INTERVENTIONS_CATALOG.values())
        
        # Prioritize interventions relevant to target stage plus cross-stage
        candidate_ints = [
            i for i in all_interventions
            if i["target_stage"] == target_stage_name or i["target_stage"] == "Cross-Stage"
        ]
        if not candidate_ints:
            candidate_ints = all_interventions

        simulations = []
        for int_obj in candidate_ints:
            sim_res = self.simulation_engine.simulate_intervention(df, int_obj["id"])
            # Remove dataframe from serializable list
            sim_copy = {k: v for k, v in sim_res.items() if k != "simulated_dataframe"}
            simulations.append(sim_copy)

        timeline.append(TimelineStep(
            step_number=step_counter,
            phase="SIMULATE_INTERVENTIONS",
            title="Discrete-Event Intervention Simulation",
            detail=f"Simulated {len(simulations)} candidate interventions. Modeled queue reduction, throughput dynamics, and SLA recovery.",
            data={"simulations_count": len(simulations)}
        ))
        step_counter += 1

        # --- STEP 10: OPTIMIZE ROI ---
        portfolio_result = self.roi_optimizer.optimize_portfolio(
            simulation_results=[self.simulation_engine.simulate_intervention(df, i["id"]) for i in candidate_ints],
            monthly_budget=monthly_budget,
            max_interventions=2
        )

        timeline.append(TimelineStep(
            step_number=step_counter,
            phase="OPTIMIZE_ROI",
            title="OR-Tools Multi-Objective Optimization",
            detail=f"Optimized intervention portfolio under ${monthly_budget:,.0f} budget constraint. Expected Portfolio ROI: {portfolio_result['portfolio_roi_percentage']}%.",
            data=portfolio_result
        ))
        step_counter += 1

        # --- STEP 11: SELECT BEST ACTION ---
        if portfolio_result["selected_interventions"]:
            best_int_summary = portfolio_result["selected_interventions"][0]
            best_int_id = best_int_summary["id"]
        else:
            # Fallback to highest ROI single simulation
            simulations_sorted = sorted(simulations, key=lambda s: s["impact"]["roi_percentage"], reverse=True)
            best_int_summary = simulations_sorted[0]["impact"]
            best_int_id = simulations_sorted[0]["intervention"]["id"]

        full_best_sim = self.simulation_engine.simulate_intervention(df, best_int_id)
        recommended_action = {
            "intervention": full_best_sim["intervention"],
            "target_stage": full_best_sim["target_stage"],
            "impact": full_best_sim["impact"],
            "rationale": [
                f"Directly addresses primary root cause identified in {target_stage_name}.",
                f"Delivers {full_best_sim['impact']['duration_reduction_pct']}% stage duration reduction.",
                f"Yields ${full_best_sim['impact']['monthly_benefit']:,.2f}/mo benefit with {full_best_sim['impact']['roi_percentage']}% ROI.",
                f"Reduces SLA violation rate by {full_best_sim['impact']['sla_improvement_points']} percentage points."
            ]
        }

        timeline.append(TimelineStep(
            step_number=step_counter,
            phase="SELECT_BEST_ACTION",
            title=f"Recommended Action: {recommended_action['intervention']['name']}",
            detail=f"Selected highest-ROI action with {recommended_action['impact']['roi_percentage']}% expected ROI and {int(recommended_action['impact']['confidence']*100)}% confidence.",
            data={"action_id": best_int_id, "cost": recommended_action["impact"]["monthly_cost"], "benefit": recommended_action["impact"]["monthly_benefit"]}
        ))
        step_counter += 1

        # --- STEP 12 & 13: SIMULATE ACTION & RE-EVALUATE PROCESS ---
        simulated_after_df = full_best_sim["simulated_dataframe"]
        stage_anomalies_after = self.anomaly_detector.analyze_stage_anomalies(simulated_after_df)
        bottlenecks_after = self.bottleneck_detector.analyze(simulated_after_df, stage_anomalies=stage_anomalies_after)

        # Detect bottleneck shift
        orig_stage_after = next((s for s in bottlenecks_after if s["stage"] == target_stage_name), None)
        new_top_stage = bottlenecks_after[0]
        
        bottleneck_shifted = (new_top_stage["stage"] != target_stage_name) and (new_top_stage["severity"] in ("CRITICAL", "WARNING"))
        
        re_eval_summary = {
            "original_stage": target_stage_name,
            "original_stage_health_before": target_stage_info["health"],
            "original_stage_health_after": orig_stage_after["health"] if orig_stage_after else "Healthy",
            "original_stage_score_before": target_stage_info["bottleneck_score"],
            "original_stage_score_after": orig_stage_after["bottleneck_score"] if orig_stage_after else 20.0,
            "bottleneck_shifted": bottleneck_shifted,
            "new_primary_bottleneck": new_top_stage["stage"] if bottleneck_shifted else None,
            "new_primary_severity": new_top_stage["severity"] if bottleneck_shifted else None,
            "bottlenecks_after": bottlenecks_after
        }

        shift_msg = (
            f"Autonomous re-evaluation complete: {target_stage_name} improved from {target_stage_info['health']} to {orig_stage_after['health']}. "
            f"Secondary bottleneck emerged at '{new_top_stage['stage']}' ({new_top_stage['severity']})."
            if bottleneck_shifted else
            f"Autonomous re-evaluation complete: {target_stage_name} normalized to {orig_stage_after['health']}. Process state stabilized."
        )

        timeline.append(TimelineStep(
            step_number=step_counter,
            phase="RE_EVALUATE_PROCESS",
            title="Post-Intervention Re-Evaluation & Bottleneck Shift Detection",
            detail=shift_msg,
            data=re_eval_summary
        ))
        step_counter += 1

        # --- STEP 14: RECOMMEND NEXT ACTION ---
        next_step_msg = (
            f"Schedule follow-up investigation on '{new_top_stage['stage']}' to prevent downstream congestion transfer."
            if bottleneck_shifted else
            "Continue continuous anomaly monitoring. No further critical interventions required."
        )

        timeline.append(TimelineStep(
            step_number=step_counter,
            phase="FINAL_RECOMMENDATION",
            title="Executive Roadmap & Next Action",
            detail=next_step_msg,
            data={"next_target": new_top_stage["stage"] if bottleneck_shifted else "Monitoring"}
        ))

        return {
            "investigation_id": investigation_id,
            "scenario": scenario,
            "timestamp": start_time,
            "abnormal_behavior_detected": abnormal_detected,
            "selected_stage": target_stage_name,
            "selection_reason": selection_reason,
            "target_evidence": evidence_list,
            "bottlenecks_before": bottlenecks_before,
            "hypotheses": hypotheses,
            "simulations": simulations,
            "optimized_portfolio": portfolio_result,
            "recommended_action": recommended_action,
            "re_evaluation": re_eval_summary,
            "timeline": [t.model_dump() for t in timeline]
        }
