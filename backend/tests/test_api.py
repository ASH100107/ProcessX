import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "processx-backend"
    assert data["models_loaded"] is True

def test_process_overview(client):
    res = client.get("/api/process/overview")
    assert res.status_code == 200
    data = res.json()
    assert "total_events" in data
    assert "stages" in data
    assert len(data["stages"]) == 6

def test_process_map(client):
    res = client.get("/api/process/map")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) == 6

def test_bottlenecks(client):
    res = client.get("/api/bottlenecks")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 6
    assert "bottleneck_score" in data[0]

def test_anomalies(client):
    res = client.get("/api/anomalies")
    assert res.status_code == 200
    data = res.json()
    assert "anomaly_rate_pct" in data
    assert "stages" in data

def test_delay_causes(client):
    res = client.get("/api/delay-causes")
    assert res.status_code == 200
    data = res.json()
    assert "stage_causes" in data

def test_investigation_lifecycle(client):
    res = client.post("/api/investigation/start", json={"scenario": "payment_verification_bottleneck"})
    assert res.status_code == 200
    data = res.json()
    assert "investigation_id" in data
    assert data["selected_stage"] == "Payment Verification"
    assert "recommended_action" in data

    # Fetch by ID
    inv_id = data["investigation_id"]
    fetch_res = client.get(f"/api/investigation/{inv_id}")
    assert fetch_res.status_code == 200
    assert fetch_res.json()["investigation_id"] == inv_id

def test_simulation_and_optimization(client):
    sim_res = client.post("/api/interventions/simulate", json={"intervention_id": "INT-PAY-01"})
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert "impact" in sim_data
    assert sim_data["impact"]["roi_percentage"] > 0

    opt_res = client.post("/api/interventions/optimize", json={"monthly_budget": 10000.0})
    assert opt_res.status_code == 200
    opt_data = opt_res.json()
    assert "portfolio_roi_percentage" in opt_data

def test_baseline_comparison(client):
    res = client.get("/api/baseline/comparison")
    assert res.status_code == 200
    data = res.json()
    assert "baseline" in data
    assert "processx_agent" in data
    assert data["comparison_summary"]["winner"] == "ProcessX Autonomous Agent"

def test_scenario_inject(client):
    res = client.post("/api/scenario/inject", json={"scenario": "packing_bottleneck"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["scenario"] == "packing_bottleneck"

def test_ml_metrics(client):
    res = client.get("/api/ml/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["models_loaded"] is True
    assert "metrics" in data
