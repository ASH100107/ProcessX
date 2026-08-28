from fastapi import APIRouter
from typing import Dict, Any
from backend.app.services.ml_service import ml_service

router = APIRouter(tags=["ML Metrics"])

@router.get("/ml/metrics")
async def get_ml_metrics() -> Dict[str, Any]:
    """
    Retrieve real evaluation metrics for all trained models:
    - Duration Predictor: MAE, RMSE, R²
    - Anomaly Detector: Contamination, anomaly statistics
    - Delay Cause Classifier: Accuracy, Precision, Recall, F1 score, Top Features
    """
    return {
        "models_loaded": ml_service.models_loaded,
        "metrics": ml_service.metrics
    }
