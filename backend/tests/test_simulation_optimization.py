import pytest
from backend.app.data.event_log import generate_process_data
from backend.app.simulation.engine import SimulationEngine
from backend.app.simulation.interventions import INTERVENTIONS_CATALOG
from backend.app.optimization.roi_optimizer import ROIOptimizer

@pytest.fixture(scope="module")
def sim_data():
    return generate_process_data(num_cases=100, scenario="payment_verification_bottleneck", seed=42)

def test_simulation_engine(sim_data):
    engine = SimulationEngine()
    result = engine.simulate_intervention(sim_data, "INT-PAY-01")
    
    assert "before" in result
    assert "after" in result
    assert "impact" in result
    assert result["after"]["mean_duration"] < result["before"]["mean_duration"]
    assert result["impact"]["duration_reduction_pct"] > 0
    assert result["impact"]["roi_percentage"] > 0
    assert result["impact"]["monthly_cost"] == 4200.0

def test_roi_optimizer(sim_data):
    engine = SimulationEngine()
    optimizer = ROIOptimizer()
    
    all_sims = [
        engine.simulate_intervention(sim_data, int_id)
        for int_id in list(INTERVENTIONS_CATALOG.keys())
    ]
    
    portfolio = optimizer.optimize_portfolio(all_sims, monthly_budget=10000.0, max_interventions=2)
    assert portfolio["solver_status"] in ("OPTIMAL", "FEASIBLE")
    assert portfolio["allocated_cost"] <= 10000.0
    assert len(portfolio["selected_interventions"]) <= 2
    assert portfolio["total_monthly_benefit"] > 0
    assert portfolio["portfolio_roi_percentage"] > 0
