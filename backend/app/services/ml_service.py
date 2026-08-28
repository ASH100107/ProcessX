"""
ML Models Container and Service
Loads and serves trained ML models.
"""

from pathlib import Path
from typing import Dict, Any, Optional
import json

from backend.app.ml.duration_predictor import DurationPredictor
from backend.app.ml.anomaly_detector import AnomalyDetector
from backend.app.ml.delay_classifier import DelayCauseClassifier
from backend.app.ml.multi_signal_bottleneck import MultiSignalBottleneckDetector
from backend.app.utils.config import settings
from backend.app.utils.logger import logger

class MLService:
    def __init__(self):
        self.duration_predictor: Optional[DurationPredictor] = None
        self.anomaly_detector: Optional[AnomalyDetector] = None
        self.delay_classifier: Optional[DelayCauseClassifier] = None
        self.bottleneck_detector: MultiSignalBottleneckDetector = MultiSignalBottleneckDetector()
        self.models_loaded: bool = False
        self.metrics: Dict[str, Any] = {}

    def load_models(self):
        """Load persisted models from models directory."""
        models_dir = settings.MODELS_DIR
        dur_path = models_dir / "duration_predictor.joblib"
        anom_path = models_dir / "anomaly_detector.joblib"
        delay_path = models_dir / "delay_classifier.joblib"
        metrics_path = models_dir / "all_model_metrics.json"

        try:
            if dur_path.exists():
                self.duration_predictor = DurationPredictor.load(dur_path)
            else:
                logger.warning("DurationPredictor artifact not found; initializing blank.")
                self.duration_predictor = DurationPredictor()

            if anom_path.exists():
                self.anomaly_detector = AnomalyDetector.load(anom_path)
            else:
                logger.warning("AnomalyDetector artifact not found; initializing blank.")
                self.anomaly_detector = AnomalyDetector()

            if delay_path.exists():
                self.delay_classifier = DelayCauseClassifier.load(delay_path)
            else:
                logger.warning("DelayCauseClassifier artifact not found; initializing blank.")
                self.delay_classifier = DelayCauseClassifier()

            if metrics_path.exists():
                with open(metrics_path, "r") as f:
                    self.metrics = json.load(f)

            self.models_loaded = True
            logger.info("All ML Models and Preprocessors successfully loaded.")
        except Exception as e:
            logger.error(f"Error loading models: {e}", exc_info=True)
            self.models_loaded = False

ml_service = MLService()
