"""
Delay-Cause Classification Model
Identifies root causes of delays and SLA violations from event characteristics.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from pathlib import Path
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split

from backend.app.data.preprocessor import FeaturePreprocessor
from backend.app.utils.logger import logger

class DelayCauseClassifier:
    def __init__(self, model_path: Path = None):
        self.model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.08,
            max_depth=5,
            random_state=42
        )
        self.preprocessor = FeaturePreprocessor()
        self.classes_: List[str] = []
        self.metrics: Dict[str, Any] = {}
        self.model_path = model_path
        self.is_fitted = False

    def train(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Train classifier on labeled delay causes."""
        logger.info("Training Delay-Cause Classification Model...")
        
        # Clean target vector
        df_clean = df.copy()
        df_clean["delay_cause"] = df_clean["delay_cause"].fillna("None").astype(str)
        
        # Features and target
        X, feature_names = self.preprocessor.fit_transform(df_clean)
        y = df_clean["delay_cause"].values
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        self.model.fit(X_train, y_train)
        self.classes_ = list(self.model.classes_)
        self.is_fitted = True
        
        # Predictions & Metrics
        y_pred = self.model.predict(X_test)
        
        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
        rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
        f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
        
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        
        # Feature importances
        importances = {}
        if hasattr(self.model, "feature_importances_"):
            feat_imp = self.model.feature_importances_
            top_indices = np.argsort(feat_imp)[::-1][:8]
            for idx in top_indices:
                if idx < len(feature_names):
                    importances[feature_names[idx]] = round(float(feat_imp[idx]), 4)

        self.metrics = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "classes": self.classes_,
            "top_features": importances,
            "detailed_report": report
        }
        
        logger.info(f"Delay-Cause Classifier trained - Accuracy: {acc:.4f}, F1: {f1:.4f}")
        return self.metrics

    def predict_causes(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Predict delay causes and probabilities for input dataframe."""
        if not self.is_fitted:
            raise ValueError("DelayCauseClassifier is not fitted.")
        X = self.preprocessor.transform(df)
        preds = self.model.predict(X)
        probs = self.model.predict_proba(X)
        
        results = []
        for i in range(len(df)):
            top_prob_idx = np.argmax(probs[i])
            top_prob = float(probs[i][top_prob_idx])
            
            # Sort top 3 causes with probabilities
            sorted_indices = np.argsort(probs[i])[::-1][:3]
            top_causes = [
                {"cause": self.classes_[idx], "probability": round(float(probs[i][idx]), 3)}
                for idx in sorted_indices if probs[i][idx] > 0.05
            ]
            
            results.append({
                "predicted_cause": preds[i],
                "confidence": round(top_prob, 3),
                "top_causes": top_causes
            })
        return results

    def analyze_stage_causes(self, df: pd.DataFrame) -> Dict[str, List[Dict[str, Any]]]:
        """Aggregate predicted delay causes by stage."""
        predictions = self.predict_causes(df)
        df_pred = df.copy()
        df_pred["pred_cause"] = [p["predicted_cause"] for p in predictions]
        df_pred["pred_conf"] = [p["confidence"] for p in predictions]
        
        stage_causes = {}
        for stage, group in df_pred.groupby("stage"):
            # Filter out 'None' or include if all are None
            delayed_group = group[group["pred_cause"] != "None"]
            target_group = delayed_group if len(delayed_group) > 0 else group
            
            cause_counts = target_group["pred_cause"].value_counts()
            total_stage_events = len(target_group)
            
            breakdown = []
            for cause, count in cause_counts.items():
                pct = round((count / total_stage_events) * 100, 1)
                avg_conf = round(float(target_group[target_group["pred_cause"] == cause]["pred_conf"].mean()), 2)
                breakdown.append({
                    "cause": cause,
                    "count": int(count),
                    "percentage": pct,
                    "average_confidence": avg_conf
                })
            stage_causes[stage] = breakdown
        return stage_causes

    def save(self, filepath: Path):
        """Save fitted model and metadata."""
        os.makedirs(filepath.parent, exist_ok=True)
        joblib.dump({
            "model": self.model,
            "preprocessor": self.preprocessor,
            "classes": self.classes_,
            "metrics": self.metrics,
            "is_fitted": self.is_fitted
        }, filepath)
        logger.info(f"Saved DelayCauseClassifier to {filepath}")

    @classmethod
    def load(cls, filepath: Path) -> "DelayCauseClassifier":
        data = joblib.load(filepath)
        instance = cls(model_path=filepath)
        instance.model = data["model"]
        instance.preprocessor = data["preprocessor"]
        instance.classes_ = data["classes"]
        instance.metrics = data["metrics"]
        instance.is_fitted = data["is_fitted"]
        logger.info(f"Loaded DelayCauseClassifier from {filepath}")
        return instance
