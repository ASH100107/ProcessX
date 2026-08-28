import pytest
import numpy as np
import pandas as pd
from backend.app.data.event_log import generate_process_data
from backend.app.ml.duration_predictor import DurationPredictor
from backend.app.ml.anomaly_detector import AnomalyDetector
from backend.app.ml.delay_classifier import DelayCauseClassifier
from backend.app.ml.multi_signal_bottleneck import MultiSignalBottleneckDetector

@pytest.fixture(scope="module")
def sample_data():
    return generate_process_data(num_cases=100, scenario="payment_verification_bottleneck", seed=42)

def test_duration_predictor(sample_data):
    predictor = DurationPredictor()
    metrics = predictor.train(sample_data)
    assert "mae" in metrics
    assert "r2" in metrics
    assert metrics["r2"] > 0.60
    
    preds = predictor.predict(sample_data.head(10))
    assert len(preds) == 10
    assert (preds > 0).all()

def test_anomaly_detector(sample_data):
    detector = AnomalyDetector(contamination=0.08)
    metrics = detector.train(sample_data)
    assert metrics["anomaly_count"] > 0
    
    scores, is_anom = detector.score_events(sample_data)
    assert len(scores) == len(sample_data)
    assert (scores >= 0.0).all() and (scores <= 1.0).all()
    
    stage_results = detector.analyze_stage_anomalies(sample_data)
    assert len(stage_results) == 6
    assert "Payment Verification" in stage_results

def test_delay_classifier(sample_data):
    classifier = DelayCauseClassifier()
    metrics = classifier.train(sample_data)
    assert metrics["accuracy"] > 0.70
    
    preds = classifier.predict_causes(sample_data.head(10))
    assert len(preds) == 10
    assert "predicted_cause" in preds[0]
    assert "confidence" in preds[0]

def test_multi_signal_bottleneck_detector(sample_data):
    detector = MultiSignalBottleneckDetector()
    results = detector.analyze(sample_data)
    assert len(results) == 6
    assert results[0]["bottleneck_score"] >= results[-1]["bottleneck_score"]
    assert results[0]["stage"] == "Payment Verification"
    assert results[0]["severity"] in ("CRITICAL", "WARNING")
    assert len(results[0]["evidence"]) > 0
