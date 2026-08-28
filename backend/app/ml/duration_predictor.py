"""
Process-Time Prediction Model
Predicts the expected execution duration for each stage of an order case.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from pathlib import Path
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from backend.app.data.preprocessor import FeaturePreprocessor
from backend.app.utils.logger import logger

class DurationPredictor:
    def __init__(self, model_path: Path = None):
        self.model = GradientBoostingRegressor(
            n_estimators=120,
            learning_rate=0.08,
            max_depth=5,
            random_state=42
        )
        self.preprocessor = FeaturePreprocessor()
        self.metrics: Dict[str, float] = {}
        self.model_path = model_path
        self.is_fitted = False

    def train(self, df: pd.DataFrame) -> Dict[str, float]:
        """Train model and evaluate performance."""
        logger.info("Training Process-Time Duration Predictor...")
        
        # Features and target
        X, feature_names = self.preprocessor.fit_transform(df)
        y = df["duration"].values
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        self.model.fit(X_train, y_train)
        self.is_fitted = True
        
        # Predictions & Metrics
        y_pred = self.model.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))
        
        self.metrics = {
            "mae": round(mae, 3),
            "rmse": round(rmse, 3),
            "r2": round(r2, 4),
            "train_samples": len(X_train),
            "test_samples": len(X_test)
        }
        
        logger.info(f"Duration Predictor trained - MAE: {mae:.3f}, RMSE: {rmse:.3f}, R2: {r2:.4f}")
        return self.metrics

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """Predict stage durations for input dataframe."""
        if not self.is_fitted:
            raise ValueError("DurationPredictor model is not fitted.")
        X = self.preprocessor.transform(df)
        return self.model.predict(X)

    def save(self, filepath: Path):
        """Save fitted model and preprocessor."""
        os.makedirs(filepath.parent, exist_ok=True)
        joblib.dump({
            "model": self.model,
            "preprocessor": self.preprocessor,
            "metrics": self.metrics,
            "is_fitted": self.is_fitted
        }, filepath)
        logger.info(f"Saved DurationPredictor to {filepath}")

    @classmethod
    def load(cls, filepath: Path) -> "DurationPredictor":
        """Load fitted model and preprocessor."""
        data = joblib.load(filepath)
        instance = cls(model_path=filepath)
        instance.model = data["model"]
        instance.preprocessor = data["preprocessor"]
        instance.metrics = data["metrics"]
        instance.is_fitted = data["is_fitted"]
        logger.info(f"Loaded DurationPredictor from {filepath}")
        return instance
