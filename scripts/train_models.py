"""
Model Training Script for ProcessX
Trains DurationPredictor, AnomalyDetector, and DelayCauseClassifier on generated event logs.
"""

import os
import sys
import json
from pathlib import Path
import pandas as pd

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from backend.app.ml.duration_predictor import DurationPredictor
from backend.app.ml.anomaly_detector import AnomalyDetector
from backend.app.ml.delay_classifier import DelayCauseClassifier
from backend.app.utils.logger import logger

def main():
    data_path = BASE_DIR / "data" / "processed" / "events_all_scenarios.csv"
    models_dir = BASE_DIR / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    
    if not data_path.exists():
        logger.error(f"Dataset not found at {data_path}. Please run scripts/generate_data.py first.")
        sys.exit(1)
        
    logger.info(f"Loading event log dataset from {data_path}...")
    df = pd.read_csv(data_path)
    logger.info(f"Loaded {len(df)} total event records.")
    
    all_metrics = {}
    
    # 1. Train Duration Predictor
    print("\n--- 1. Training Duration Predictor ---")
    duration_predictor = DurationPredictor()
    duration_metrics = duration_predictor.train(df)
    duration_predictor.save(models_dir / "duration_predictor.joblib")
    all_metrics["duration_predictor"] = duration_metrics
    
    # 2. Train Anomaly Detector
    print("\n--- 2. Training Anomaly Detector ---")
    anomaly_detector = AnomalyDetector(contamination=0.08)
    anomaly_metrics = anomaly_detector.train(df)
    anomaly_detector.save(models_dir / "anomaly_detector.joblib")
    all_metrics["anomaly_detector"] = anomaly_metrics
    
    # 3. Train Delay Cause Classifier
    print("\n--- 3. Training Delay-Cause Classifier ---")
    delay_classifier = DelayCauseClassifier()
    delay_metrics = delay_classifier.train(df)
    delay_classifier.save(models_dir / "delay_classifier.joblib")
    all_metrics["delay_classifier"] = delay_metrics
    
    # Save combined metrics JSON
    metrics_path = models_dir / "all_model_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(all_metrics, f, indent=2)
    logger.info(f"[+] All models trained and saved. Metrics written to {metrics_path}")
    print(f"\n[+] Training Complete! Metrics saved to {metrics_path}")

if __name__ == "__main__":
    main()
