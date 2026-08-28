"""
Process State and Analytics Service
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Any, Optional

from backend.app.data.event_log import generate_process_data, STAGES
from backend.app.services.ml_service import ml_service
from backend.app.simulation.engine import SimulationEngine
from backend.app.optimization.roi_optimizer import ROIOptimizer
from backend.app.agents.investigator import AutonomousInvestigator
from backend.app.services.baseline_service import BaselineComparisonService
from backend.app.utils.config import settings
from backend.app.utils.logger import logger

class ProcessService:
    def __init__(self):
        self.current_scenario: str = "payment_verification_bottleneck"
        self.current_df: Optional[pd.DataFrame] = None
        self.simulation_engine: SimulationEngine = SimulationEngine()
        self.roi_optimizer: ROIOptimizer = ROIOptimizer()
        self.baseline_service: BaselineComparisonService = BaselineComparisonService(self.simulation_engine)
        self.investigation_history: Dict[str, Dict[str, Any]] = {}
        self._last_investigation: Optional[Dict[str, Any]] = None

    def initialize(self):
        """Load default scenario on startup."""
        self.load_scenario(self.current_scenario)

    def load_scenario(self, scenario_name: str) -> pd.DataFrame:
        """Load scenario CSV or generate if not found."""
        logger.info(f"Loading scenario: {scenario_name}...")
        csv_path = settings.DATA_DIR / "raw" / f"events_{scenario_name}.csv"
        
        if csv_path.exists():
            self.current_df = pd.read_csv(csv_path)
            self.current_df["delay_cause"] = self.current_df["delay_cause"].fillna("None").astype(str)
        else:
            logger.info(f"Generating synthetic dataset for scenario '{scenario_name}'...")
            self.current_df = generate_process_data(num_cases=2000, scenario=scenario_name, seed=42)
            
        self.current_scenario = scenario_name
        logger.info(f"Loaded {len(self.current_df)} events for scenario '{scenario_name}'.")
        return self.current_df

    def get_overview(self) -> Dict[str, Any]:
        """Compute end-to-end process overview metrics."""
        df = self.current_df
        if df is None:
            df = self.load_scenario(self.current_scenario)

        stage_anomalies = ml_service.anomaly_detector.analyze_stage_anomalies(df) if ml_service.anomaly_detector.is_fitted else None
        bottlenecks = ml_service.bottleneck_detector.analyze(df, stage_anomalies=stage_anomalies)

        case_totals = df.groupby("case_id")["duration"].sum()
        avg_lead_time = round(float(case_totals.mean()), 2)
        p95_lead_time = round(float(np.percentile(case_totals, 95)), 2)

        sla_violations_total = int(df["sla_violation"].sum())
        sla_compliance_rate = round(100.0 - ((sla_violations_total / len(df)) * 100.0), 2)
        
        anom_rate = round(float(np.mean([b["anomaly_rate_pct"] for b in bottlenecks])), 2)

        primary_bottleneck = bottlenecks[0] if bottlenecks else {"stage": "None", "severity": "HEALTHY"}

        return {
            "scenario": self.current_scenario,
            "total_events": len(df),
            "total_cases": int(df["case_id"].nunique()),
            "avg_process_lead_time": avg_lead_time,
            "p95_process_lead_time": p95_lead_time,
            "overall_sla_compliance_rate": sla_compliance_rate,
            "overall_anomaly_rate": anom_rate,
            "primary_bottleneck_stage": primary_bottleneck["stage"],
            "primary_bottleneck_severity": primary_bottleneck["severity"],
            "stages": bottlenecks
        }

    def get_process_map(self) -> Dict[str, Any]:
        """Build interactive graph node data for the 6-stage process."""
        overview = self.get_overview()
        stages_data = overview["stages"]

        nodes = []
        for s in stages_data:
            nodes.append({
                "id": s["stage"].lower().replace(" ", "_"),
                "name": s["stage"],
                "order": s["stage_order"],
                "health": s["health"],
                "severity": s["severity"],
                "bottleneck_score": s["bottleneck_score"],
                "mean_duration": s["mean_duration"],
                "sla_target": s["sla_target"],
                "mean_queue_time": s["mean_queue_time"],
                "mean_processing_time": s["mean_processing_time"],
                "utilization": s["resource_utilization"],
                "sla_violation_rate": s["sla_violation_rate"],
                "anomaly_rate": s["anomaly_rate_pct"],
                "throughput": s["throughput_per_hr"],
                "delay_contribution": s["delay_contribution_pct"]
            })

        # Edges between consecutive stages
        edges = []
        for i in range(len(nodes) - 1):
            edges.append({
                "id": f"edge_{nodes[i]['id']}_to_{nodes[i+1]['id']}",
                "source": nodes[i]["id"],
                "target": nodes[i+1]["id"],
                "transfer_time": "0.5m",
                "label": "Next Stage Handover"
            })

        return {
            "nodes": sorted(nodes, key=lambda n: n["order"]),
            "edges": edges,
            "scenario": self.current_scenario
        }

    def get_bottlenecks(self) -> List[Dict[str, Any]]:
        """Get ranked stage bottlenecks."""
        overview = self.get_overview()
        return overview["stages"]

    def get_anomalies(self) -> Dict[str, Any]:
        """Get anomaly distribution across stages."""
        df = self.current_df
        if ml_service.anomaly_detector.is_fitted:
            stage_anom = ml_service.anomaly_detector.analyze_stage_anomalies(df)
            scores, is_anom = ml_service.anomaly_detector.score_events(df)
            total_anom = int(is_anom.sum())
            total_rate = round((total_anom / len(df)) * 100.0, 2)
            
            # Sample of anomalous events
            df_anom = df[is_anom].head(15).copy()
            df_anom["anomaly_score"] = scores[is_anom][:15]
            recent_anomalies = df_anom[[
                "case_id", "stage", "duration", "queue_time", "processing_time",
                "resource_utilization", "sla_target", "delay_cause", "anomaly_score"
            ]].to_dict(orient="records")
        else:
            stage_anom = {}
            total_anom = 0
            total_rate = 0.0
            recent_anomalies = []

        return {
            "total_anomalies": total_anom,
            "anomaly_rate_pct": total_rate,
            "stages": stage_anom,
            "recent_anomalous_events": recent_anomalies
        }

    def get_delay_causes(self) -> Dict[str, Any]:
        """Get delay cause breakdown from classifier."""
        df = self.current_df
        if ml_service.delay_classifier.is_fitted:
            stage_causes = ml_service.delay_classifier.analyze_stage_causes(df)
        else:
            stage_causes = {}
        return {
            "scenario": self.current_scenario,
            "stage_causes": stage_causes
        }

    def run_investigation(self, scenario: Optional[str] = None, monthly_budget: float = 12000.0) -> Dict[str, Any]:
        """Execute full autonomous investigator agent."""
        if scenario and scenario != self.current_scenario:
            self.load_scenario(scenario)
            
        investigator = AutonomousInvestigator(
            bottleneck_detector=ml_service.bottleneck_detector,
            anomaly_detector=ml_service.anomaly_detector,
            delay_classifier=ml_service.delay_classifier,
            simulation_engine=self.simulation_engine,
            roi_optimizer=self.roi_optimizer
        )
        
        result = investigator.run_investigation(
            df=self.current_df,
            scenario=self.current_scenario,
            monthly_budget=monthly_budget
        )
        
        self.investigation_history[result["investigation_id"]] = result
        self._last_investigation = result
        return result

    def get_investigation_by_id(self, inv_id: str) -> Optional[Dict[str, Any]]:
        return self.investigation_history.get(inv_id)

    def get_baseline_comparison(self) -> Dict[str, Any]:
        """Compare baseline heuristic vs ProcessX Agent."""
        if not self._last_investigation:
            self.run_investigation()
        return self.baseline_service.run_comparison(self.current_df, self._last_investigation)

    def re_evaluate_process(self, intervention_id: str) -> Dict[str, Any]:
        """Apply intervention to process state and recalculate all metrics."""
        full_sim = self.simulation_engine.simulate_intervention(
            df=self.current_df,
            intervention_id=intervention_id
        )
        sim_df = full_sim["simulated_dataframe"]
        self.current_df = sim_df

        anom_after = ml_service.anomaly_detector.analyze_stage_anomalies(sim_df) if ml_service.anomaly_detector.is_fitted else None
        re_ranked = ml_service.bottleneck_detector.analyze(sim_df, stage_anomalies=anom_after)

        target_stage = full_sim["target_stage"]
        orig_before = next((s for s in re_ranked if s["stage"] == target_stage), None)
        new_top_stage = re_ranked[0]
        bottleneck_shifted = (
            new_top_stage["stage"] != target_stage
            and new_top_stage["severity"] in ("CRITICAL", "WARNING")
        )

        return {
            "applied_intervention": full_sim["intervention"],
            "target_stage": target_stage,
            "impact": full_sim["impact"],
            "bottleneck_shifted": bottleneck_shifted,
            "new_primary_bottleneck": new_top_stage["stage"] if bottleneck_shifted else None,
            "new_primary_severity": new_top_stage["severity"] if bottleneck_shifted else None,
            "original_stage_health_after": orig_before["health"] if orig_before else "Healthy",
            "stages_after": re_ranked
        }

process_service = ProcessService()
