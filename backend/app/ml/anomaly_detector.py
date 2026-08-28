"""
Process Anomaly Detection Model using Isolation Forest
Detects event-level, stage-level, and process-level anomalies.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from backend.app.utils.logger import logger

class AnomalyDetector:
    def __init__(self, contamination: float = 0.08, model_path: Path = None):
        self.contamination = contamination
        self.model = IsolationForest(
            n_estimators=150,
            contamination=contamination,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.feature_cols = [
            "duration",
            "queue_time",
            "processing_time",
            "resource_utilization",
            "queue_length"
        ]
        self.metrics: Dict[str, Any] = {}
        self.model_path = model_path
        self.is_fitted = False

    def _prepare_features(self, df: pd.DataFrame) -> np.ndarray:
        df_copy = df.copy()
        # Handle potential missing columns
        for col in self.feature_cols:
            if col not in df_copy.columns:
                df_copy[col] = 0.0
        return df_copy[self.feature_cols].fillna(0.0).values

    def train(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Train Isolation Forest on process metrics."""
        logger.info("Training Process Anomaly Detector (Isolation Forest)...")
        raw_X = self._prepare_features(df)
        X = self.scaler.fit_transform(raw_X)
        
        self.model.fit(X)
        self.is_fitted = True
        
        preds = self.model.predict(X)
        scores = self.model.decision_function(X)
        
        anomaly_count = int(np.sum(preds == -1))
        anomaly_percentage = float(round((anomaly_count / len(df)) * 100, 2))
        
        self.metrics = {
            "total_samples": len(df),
            "anomaly_count": anomaly_count,
            "anomaly_percentage": anomaly_percentage,
            "contamination": self.contamination,
            "feature_columns": self.feature_cols
        }
        
        logger.info(f"Anomaly Detector trained - Found {anomaly_count} anomalies ({anomaly_percentage}%)")
        return self.metrics

    def score_events(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Return (anomaly_scores, is_anomaly_bool_array).
        Anomaly score is scaled from 0 (very normal) to 1.0 (highly anomalous).
        """
        if not self.is_fitted:
            raise ValueError("AnomalyDetector is not fitted.")
        raw_X = self._prepare_features(df)
        X = self.scaler.transform(raw_X)
        
        # Decision function: lower values mean more anomalous
        raw_scores = self.model.decision_function(X)
        # Normalize to [0, 1] where 1 is highest anomaly severity
        norm_scores = 1.0 / (1.0 + np.exp(raw_scores * 3.0))
        norm_scores = np.clip(norm_scores, 0.0, 1.0)
        
        preds = self.model.predict(X)
        is_anomaly = (preds == -1)
        
        return norm_scores, is_anomaly

    def analyze_stage_anomalies(self, df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
        """Calculate anomaly rates and summary per stage."""
        scores, is_anom = self.score_events(df)
        df_scored = df.copy()
        df_scored["anomaly_score"] = scores
        df_scored["is_anomaly"] = is_anom
        
        stage_results = {}
        for stage, group in df_scored.groupby("stage"):
            count = len(group)
            anom_count = int(group["is_anomaly"].sum())
            anom_rate = round((anom_count / count) * 100, 2) if count > 0 else 0.0
            avg_score = round(float(group["anomaly_score"].mean()), 4)
            p95_score = round(float(np.percentile(group["anomaly_score"], 95)), 4)
            
            stage_results[stage] = {
                "stage": stage,
                "total_events": count,
                "anomaly_count": anom_count,
                "anomaly_rate_pct": anom_rate,
                "mean_anomaly_score": avg_score,
                "p95_anomaly_score": p95_score,
                "is_abnormal": anom_rate > 10.0 or avg_score > 0.45
            }
        return stage_results

    def save(self, filepath: Path):
        """Save fitted Isolation Forest."""
        os.makedirs(filepath.parent, exist_ok=True)
        joblib.dump({
            "model": self.model,
            "scaler": self.scaler,
            "metrics": self.metrics,
            "feature_cols": self.feature_cols,
            "is_fitted": self.is_fitted
        }, filepath)
        logger.info(f"Saved AnomalyDetector to {filepath}")

    @classmethod
    def load(cls, filepath: Path) -> "AnomalyDetector":
        data = joblib.load(filepath)
        instance = cls(model_path=filepath)
        instance.model = data["model"]
        instance.scaler = data["scaler"]
        instance.metrics = data["metrics"]
        instance.feature_cols = data["feature_cols"]
        instance.is_fitted = data["is_fitted"]
        logger.info(f"Loaded AnomalyDetector from {filepath}")
        return instance
