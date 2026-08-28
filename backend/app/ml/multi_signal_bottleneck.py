"""
Multi-Signal Bottleneck Detection Engine
Evaluates process stages using a multi-criteria decision matrix across 8 distinct operational signals.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional

class MultiSignalBottleneckDetector:
    def __init__(self):
        # Weights for multi-signal composite score
        self.weights = {
            "p95_delay_ratio": 0.22,
            "queue_ratio": 0.20,
            "sla_violation_rate": 0.20,
            "resource_utilization": 0.14,
            "anomaly_rate": 0.12,
            "delay_contribution": 0.12
        }

    def analyze(
        self,
        df: pd.DataFrame,
        stage_anomalies: Optional[Dict[str, Dict[str, Any]]] = None,
        duration_predictions: Optional[np.ndarray] = None
    ) -> List[Dict[str, Any]]:
        """
        Compute multi-signal bottleneck scores and metrics across all process stages.
        """
        df_work = df.copy()
        total_process_duration = df_work["duration"].sum()
        
        stages = df_work["stage"].unique()
        stage_metrics = []
        
        for stage in stages:
            stage_df = df_work[df_work["stage"] == stage]
            event_count = len(stage_df)
            if event_count == 0:
                continue
                
            mean_duration = float(stage_df["duration"].mean())
            median_duration = float(stage_df["duration"].median())
            p95_duration = float(np.percentile(stage_df["duration"], 95))
            sla_target = float(stage_df["sla_target"].iloc[0]) if "sla_target" in stage_df.columns else 15.0
            
            mean_queue = float(stage_df["queue_time"].mean())
            mean_proc = float(stage_df["processing_time"].mean())
            queue_ratio = mean_queue / max(0.01, mean_duration)
            
            mean_util = float(stage_df["resource_utilization"].mean()) if "resource_utilization" in stage_df.columns else 0.5
            
            sla_violations = int(stage_df["sla_violation"].sum()) if "sla_violation" in stage_df.columns else 0
            sla_violation_rate = (sla_violations / event_count) * 100.0
            
            # Delay contribution
            stage_total_duration = stage_df["duration"].sum()
            delay_contrib_pct = (stage_total_duration / total_process_duration) * 100.0 if total_process_duration > 0 else 0.0
            
            # Anomaly rate from anomaly detector or default
            if stage_anomalies and stage in stage_anomalies:
                anomaly_rate_pct = stage_anomalies[stage].get("anomaly_rate_pct", 0.0)
                mean_anomaly_score = stage_anomalies[stage].get("mean_anomaly_score", 0.0)
            else:
                anomaly_rate_pct = 5.0
                mean_anomaly_score = 0.2
                
            # Normalized signal components (0 to 1 scale)
            norm_p95 = min(1.0, (p95_duration / sla_target) / 2.0)
            norm_queue = min(1.0, queue_ratio * 1.5)
            norm_sla = min(1.0, sla_violation_rate / 60.0)
            norm_util = min(1.0, max(0.0, (mean_util - 0.5) / 0.5))
            norm_anom = min(1.0, anomaly_rate_pct / 40.0)
            norm_delay = min(1.0, delay_contrib_pct / 50.0)
            
            # Composite Bottleneck Score (0 to 100)
            composite_score = (
                norm_p95 * self.weights["p95_delay_ratio"] +
                norm_queue * self.weights["queue_ratio"] +
                norm_sla * self.weights["sla_violation_rate"] +
                norm_util * self.weights["resource_utilization"] +
                norm_anom * self.weights["anomaly_rate"] +
                norm_delay * self.weights["delay_contribution"]
            ) * 100.0
            
            composite_score = round(float(composite_score), 1)
            
            # Severity assignment
            if composite_score >= 68.0 or sla_violation_rate >= 35.0:
                severity = "CRITICAL"
                health = "Critical"
            elif composite_score >= 40.0 or sla_violation_rate >= 15.0:
                severity = "WARNING"
                health = "Warning"
            else:
                severity = "HEALTHY"
                health = "Healthy"
                
            # Collect concrete evidence
            evidence = []
            if p95_duration > sla_target * 1.3:
                evidence.append(f"P95 duration ({p95_duration:.1f}m) exceeds SLA target ({sla_target:.1f}m) by {((p95_duration/sla_target - 1)*100):.1f}%")
            if queue_ratio > 0.45:
                evidence.append(f"Queue time represents {queue_ratio*100:.1f}% of total stage duration (backlog buildup)")
            if sla_violation_rate > 10.0:
                evidence.append(f"SLA violation rate elevated at {sla_violation_rate:.1f}% ({sla_violations} cases violated)")
            if mean_util > 0.85:
                evidence.append(f"Resource utilization saturated at {mean_util*100:.1f}%")
            if anomaly_rate_pct > 12.0:
                evidence.append(f"Isolation Forest flagged {anomaly_rate_pct:.1f}% anomalous process events")
            if delay_contrib_pct > 25.0:
                evidence.append(f"Stage accounts for {delay_contrib_pct:.1f}% of entire end-to-end process lead time")
                
            if not evidence:
                evidence.append(f"Stage operating stably within SLA tolerance ({sla_target:.1f}m target).")
                
            throughput_per_hr = round(60.0 / max(0.5, mean_duration), 1)
            
            stage_metrics.append({
                "stage": stage,
                "stage_order": int(stage_df["stage_order"].iloc[0]) if "stage_order" in stage_df.columns else 1,
                "bottleneck_score": composite_score,
                "severity": severity,
                "health": health,
                "mean_duration": round(mean_duration, 2),
                "median_duration": round(median_duration, 2),
                "p95_duration": round(p95_duration, 2),
                "sla_target": round(sla_target, 2),
                "sla_violation_rate": round(sla_violation_rate, 2),
                "sla_violations_count": sla_violations,
                "mean_queue_time": round(mean_queue, 2),
                "mean_processing_time": round(mean_proc, 2),
                "queue_ratio": round(queue_ratio, 3),
                "resource_utilization": round(mean_util, 3),
                "throughput_per_hr": throughput_per_hr,
                "delay_contribution_pct": round(delay_contrib_pct, 2),
                "anomaly_rate_pct": round(anomaly_rate_pct, 2),
                "evidence": evidence
            })
            
        # Sort by bottleneck_score descending
        stage_metrics.sort(key=lambda x: x["bottleneck_score"], reverse=True)
        return stage_metrics
