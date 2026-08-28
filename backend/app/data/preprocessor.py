"""
Feature Preprocessor and Engineering Pipeline for ProcessX
"""

import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer

class FeaturePreprocessor:
    def __init__(self):
        self.categorical_cols = ["stage", "priority", "region"]
        self.numerical_cols = [
            "order_value_log",
            "queue_length",
            "resource_utilization",
            "stage_order",
            "hour_of_day",
            "day_of_week"
        ]
        self.preprocessor = None
        self.feature_names = []

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add time-based and transformed features."""
        df_feat = df.copy()
        
        # Ensure timestamp is datetime
        df_feat["timestamp_dt"] = pd.to_datetime(df_feat["timestamp"])
        df_feat["hour_of_day"] = df_feat["timestamp_dt"].dt.hour.fillna(12)
        df_feat["day_of_week"] = df_feat["timestamp_dt"].dt.dayofweek.fillna(2)
        
        # Log transform order value
        order_val = df_feat["order_value"].fillna(100.0).clip(lower=1.0)
        df_feat["order_value_log"] = np.log1p(order_val)
        
        df_feat["queue_length"] = df_feat["queue_length"].fillna(1.0)
        df_feat["resource_utilization"] = df_feat["resource_utilization"].fillna(0.5)
        
        # Stage order mapping if not present
        if "stage_order" not in df_feat.columns:
            stage_order_map = {
                "Order Received": 1,
                "Payment Verification": 2,
                "Inventory Check": 3,
                "Order Packing": 4,
                "Shipping Preparation": 5,
                "Shipment Dispatch": 6
            }
            df_feat["stage_order"] = df_feat["stage"].map(stage_order_map).fillna(1)
        else:
            df_feat["stage_order"] = df_feat["stage_order"].fillna(1)
            
        for cat in self.categorical_cols:
            if cat not in df_feat.columns:
                df_feat[cat] = "Unknown"
            else:
                df_feat[cat] = df_feat[cat].fillna("Unknown").astype(str)
            
        return df_feat

    def fit_transform(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """Fit feature transformations and return engineered matrix."""
        df_feat = self.engineer_features(df)
        
        self.preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), self.numerical_cols),
                ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), self.categorical_cols)
            ]
        )
        
        X = self.preprocessor.fit_transform(df_feat)
        
        # Extract feature names
        num_names = self.numerical_cols
        cat_encoder = self.preprocessor.named_transformers_["cat"]
        cat_names = list(cat_encoder.get_feature_names_out(self.categorical_cols))
        self.feature_names = num_names + cat_names
        
        return X, self.feature_names

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        """Transform new event data using fitted preprocessor."""
        if self.preprocessor is None:
            raise ValueError("Preprocessor has not been fitted yet.")
        df_feat = self.engineer_features(df)
        return self.preprocessor.transform(df_feat)
