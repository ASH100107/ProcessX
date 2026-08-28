"""
Process Intervention Simulation Engine
Simulates queue and processing dynamics under candidate interventions.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from backend.app.simulation.interventions import INTERVENTIONS_CATALOG, get_intervention_by_id

class SimulationEngine:
    def __init__(self):
        pass

    def simulate_intervention(
        self,
        df: pd.DataFrame,
        intervention_id: str,
        custom_cost: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Simulate applying an intervention to the process event log.
        Returns detailed before/after comparison and ROI metrics.
        """
        intervention = get_intervention_by_id(intervention_id)
        if not intervention:
            raise ValueError(f"Unknown intervention ID: {intervention_id}")

        target_stage = intervention["target_stage"]
        q_factor = intervention["queue_reduction_factor"]
        p_factor = intervention["proc_reduction_factor"]
        util_relief = intervention["utilization_relief"]
        cost = custom_cost if custom_cost is not None else intervention["monthly_cost"]
        base_benefit = intervention["base_financial_benefit"]

        # Deep copy to simulate
        sim_df = df.copy()

        # Identify affected cases
        if target_stage == "Cross-Stage":
            affected_mask = pd.Series(True, index=sim_df.index)
        else:
            affected_mask = sim_df["stage"] == target_stage

        # Before stats on target stage (or full process if cross-stage)
        eval_df_before = sim_df[affected_mask] if target_stage != "Cross-Stage" else sim_df
        before_mean_dur = float(eval_df_before["duration"].mean())
        before_p95_dur = float(np.percentile(eval_df_before["duration"], 95))
        before_mean_q = float(eval_df_before["queue_time"].mean())
        before_mean_proc = float(eval_df_before["processing_time"].mean())
        before_sla_viols = int(eval_df_before["sla_violation"].sum())
        before_sla_rate = (before_sla_viols / len(eval_df_before)) * 100.0 if len(eval_df_before) > 0 else 0.0
        before_util = float(eval_df_before["resource_utilization"].mean())

        # Apply simulation transformations with stochastic variance
        np.random.seed(42)
        noise_q = np.random.normal(1.0, 0.05, size=int(affected_mask.sum()))
        noise_p = np.random.normal(1.0, 0.03, size=int(affected_mask.sum()))

        sim_df.loc[affected_mask, "queue_time"] = (
            sim_df.loc[affected_mask, "queue_time"] * q_factor * noise_q
        ).clip(lower=0.1).round(2)

        sim_df.loc[affected_mask, "processing_time"] = (
            sim_df.loc[affected_mask, "processing_time"] * p_factor * noise_p
        ).clip(lower=0.2).round(2)

        sim_df.loc[affected_mask, "duration"] = (
            sim_df.loc[affected_mask, "queue_time"] + sim_df.loc[affected_mask, "processing_time"]
        ).round(2)

        sim_df.loc[affected_mask, "resource_utilization"] = (
            sim_df.loc[affected_mask, "resource_utilization"] - util_relief
        ).clip(lower=0.25, upper=0.98).round(3)

        # Recalculate SLA violations
        sim_df["sla_violation"] = sim_df["duration"] > sim_df["sla_target"]
        
        # After stats
        eval_df_after = sim_df[affected_mask] if target_stage != "Cross-Stage" else sim_df
        after_mean_dur = float(eval_df_after["duration"].mean())
        after_p95_dur = float(np.percentile(eval_df_after["duration"], 95))
        after_mean_q = float(eval_df_after["queue_time"].mean())
        after_mean_proc = float(eval_df_after["processing_time"].mean())
        after_sla_viols = int(eval_df_after["sla_violation"].sum())
        after_sla_rate = (after_sla_viols / len(eval_df_after)) * 100.0 if len(eval_df_after) > 0 else 0.0
        after_util = float(eval_df_after["resource_utilization"].mean())

        # Improvements
        dur_reduction_pct = max(0.0, ((before_mean_dur - after_mean_dur) / max(0.01, before_mean_dur)) * 100.0)
        p95_reduction_pct = max(0.0, ((before_p95_dur - after_p95_dur) / max(0.01, before_p95_dur)) * 100.0)
        sla_improvement_pct = max(0.0, before_sla_rate - after_sla_rate)
        
        before_tput = 60.0 / max(0.5, before_mean_dur)
        after_tput = 60.0 / max(0.5, after_mean_dur)
        tput_increase_pct = max(0.0, ((after_tput - before_tput) / before_tput) * 100.0)

        # Dynamic benefit calculation
        # Value derived from: (time saved * value/hr) + (SLA penalties averted) + (throughput gain)
        time_saved_mins_per_case = max(0.0, before_mean_dur - after_mean_dur)
        cases_per_month = 6000 # Estimated standard monthly volume
        hours_saved_monthly = (time_saved_mins_per_case * cases_per_month) / 60.0
        
        sla_penalties_averted = (before_sla_viols - after_sla_viols) * 28.50 # $28.50 per SLA breach fine
        labor_savings = hours_saved_monthly * 32.0 # $32/hr labor equivalent
        dynamic_financial_benefit = max(base_benefit * 0.7, labor_savings + sla_penalties_averted + (base_benefit * 0.4))
        dynamic_financial_benefit = round(float(dynamic_financial_benefit), 2)

        # ROI formula: (Benefit - Cost) / Cost * 100
        net_profit = dynamic_financial_benefit - cost
        roi = (net_profit / cost) * 100.0 if cost > 0 else 0.0
        roi = round(float(roi), 1)
        
        # Confidence score based on data volume and variance
        confidence = min(0.96, round(0.82 + (len(df) / 100000.0) + (0.05 if dur_reduction_pct > 20 else 0.0), 2))

        return {
            "intervention": intervention,
            "target_stage": target_stage,
            "before": {
                "mean_duration": round(before_mean_dur, 2),
                "p95_duration": round(before_p95_dur, 2),
                "mean_queue_time": round(before_mean_q, 2),
                "mean_processing_time": round(before_mean_proc, 2),
                "sla_violation_rate": round(before_sla_rate, 2),
                "resource_utilization": round(before_util, 3),
                "throughput_per_hr": round(before_tput, 1)
            },
            "after": {
                "mean_duration": round(after_mean_dur, 2),
                "p95_duration": round(after_p95_dur, 2),
                "mean_queue_time": round(after_mean_q, 2),
                "mean_processing_time": round(after_mean_proc, 2),
                "sla_violation_rate": round(after_sla_rate, 2),
                "resource_utilization": round(after_util, 3),
                "throughput_per_hr": round(after_tput, 1)
            },
            "impact": {
                "duration_reduction_pct": round(dur_reduction_pct, 1),
                "p95_reduction_pct": round(p95_reduction_pct, 1),
                "sla_improvement_points": round(sla_improvement_pct, 1),
                "throughput_increase_pct": round(tput_increase_pct, 1),
                "monthly_cost": cost,
                "monthly_benefit": dynamic_financial_benefit,
                "net_profit_monthly": round(net_profit, 2),
                "roi_percentage": roi,
                "confidence": confidence,
                "hours_saved_monthly": round(hours_saved_monthly, 1)
            },
            "simulated_dataframe": sim_df
        }
