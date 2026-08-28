import pytest
from backend.app.data.event_log import generate_process_data
from backend.app.ml.multi_signal_bottleneck import MultiSignalBottleneckDetector
from backend.app.ml.anomaly_detector import AnomalyDetector
from backend.app.ml.delay_classifier import DelayCauseClassifier
from backend.app.simulation.engine import SimulationEngine
from backend.app.optimization.roi_optimizer import ROIOptimizer
from backend.app.agents.investigator import AutonomousInvestigator

@pytest.fixture(scope="module")
def agent_components():
    data = generate_process_data(num_cases=100, scenario="payment_verification_bottleneck", seed=42)
    
    anom = AnomalyDetector()
    anom.train(data)
    
    classifier = DelayCauseClassifier()
    classifier.train(data)
    
    bottleneck_detector = MultiSignalBottleneckDetector()
    sim_engine = SimulationEngine()
    roi_optimizer = ROIOptimizer()
    
    investigator = AutonomousInvestigator(
        bottleneck_detector=bottleneck_detector,
        anomaly_detector=anom,
        delay_classifier=classifier,
        simulation_engine=sim_engine,
        roi_optimizer=roi_optimizer
    )
    return investigator, data

def test_autonomous_investigator_lifecycle(agent_components):
    investigator, data = agent_components
    result = investigator.run_investigation(data, scenario="payment_verification_bottleneck")
    
    assert result["investigation_id"].startswith("INV-")
    assert result["abnormal_behavior_detected"] is True
    assert result["selected_stage"] == "Payment Verification"
    assert len(result["hypotheses"]) >= 3
    assert len(result["simulations"]) >= 1
    assert "recommended_action" in result
    assert result["recommended_action"]["impact"]["roi_percentage"] > 0
    assert "re_evaluation" in result
    assert len(result["timeline"]) >= 10
