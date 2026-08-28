"""
OR-Tools ROI & Portfolio Optimizer for ProcessX
Formulates mathematical programming optimization over candidate interventions.
"""

from typing import Dict, List, Any, Optional
from ortools.linear_solver import pywraplp
from backend.app.simulation.interventions import INTERVENTIONS_CATALOG
from backend.app.utils.logger import logger

class ROIOptimizer:
    def __init__(self):
        pass

    def optimize_portfolio(
        self,
        simulation_results: List[Dict[str, Any]],
        monthly_budget: float = 12000.0,
        max_interventions: int = 3,
        enforce_single_per_stage: bool = True
    ) -> Dict[str, Any]:
        """
        Use OR-Tools MIP solver (CBC / SCIP) to select optimal intervention portfolio.
        Maximizes Total Net Monthly Benefit subject to budget and operational constraints.
        """
        logger.info(f"Running OR-Tools Optimization with Budget: ${monthly_budget}...")
        
        solver = pywraplp.Solver.CreateSolver("SCIP")
        if not solver:
            solver = pywraplp.Solver.CreateSolver("CBC")
        if not solver:
            raise RuntimeError("OR-Tools MIP solver could not be initialized.")

        # Variables: x[i] = 1 if intervention i selected, 0 otherwise
        n = len(simulation_results)
        x = [solver.IntVar(0, 1, f"x_{i}") for i in range(n)]

        # Objective: Maximize sum of net benefits
        objective = solver.Objective()
        for i, sim in enumerate(simulation_results):
            net_benefit = sim["impact"]["net_profit_monthly"]
            objective.SetCoefficient(x[i], float(net_benefit))
        objective.SetMaximization()

        # Constraint 1: Total monthly cost <= monthly_budget
        cost_constraint = solver.Constraint(0, monthly_budget, "BudgetConstraint")
        for i, sim in enumerate(simulation_results):
            cost_constraint.SetCoefficient(x[i], float(sim["impact"]["monthly_cost"]))

        # Constraint 2: Total number of interventions <= max_interventions
        count_constraint = solver.Constraint(0, max_interventions, "CountConstraint")
        for i in range(n):
            count_constraint.SetCoefficient(x[i], 1.0)

        # Constraint 3: At most 1 intervention per target stage (if enforce_single_per_stage)
        if enforce_single_per_stage:
            stage_to_indices: Dict[str, List[int]] = {}
            for i, sim in enumerate(simulation_results):
                stage = sim["target_stage"]
                if stage != "Cross-Stage":
                    stage_to_indices.setdefault(stage, []).append(i)

            for stage, indices in stage_to_indices.items():
                if len(indices) > 1:
                    stage_constraint = solver.Constraint(0, 1, f"StageLimit_{stage}")
                    for idx in indices:
                        stage_constraint.SetCoefficient(x[idx], 1.0)

        status = solver.Solve()

        selected_interventions = []
        total_cost = 0.0
        total_benefit = 0.0
        total_net_profit = 0.0

        if status in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
            for i in range(n):
                if x[i].solution_value() > 0.5:
                    sim = simulation_results[i]
                    cost = sim["impact"]["monthly_cost"]
                    benefit = sim["impact"]["monthly_benefit"]
                    net = sim["impact"]["net_profit_monthly"]
                    
                    total_cost += cost
                    total_benefit += benefit
                    total_net_profit += net
                    
                    selected_interventions.append({
                        "id": sim["intervention"]["id"],
                        "name": sim["intervention"]["name"],
                        "target_stage": sim["target_stage"],
                        "category": sim["intervention"]["category"],
                        "monthly_cost": cost,
                        "monthly_benefit": benefit,
                        "net_profit_monthly": net,
                        "roi_percentage": sim["impact"]["roi_percentage"],
                        "duration_reduction_pct": sim["impact"]["duration_reduction_pct"],
                        "sla_improvement_points": sim["impact"]["sla_improvement_points"],
                        "confidence": sim["impact"]["confidence"]
                    })
        else:
            logger.warning("Optimization did not find optimal solution; falling back to greedy ranking.")
            # Greedy fallback
            sorted_sims = sorted(simulation_results, key=lambda s: s["impact"]["roi_percentage"], reverse=True)
            curr_cost = 0.0
            for s in sorted_sims:
                cost = s["impact"]["monthly_cost"]
                if curr_cost + cost <= monthly_budget and len(selected_interventions) < max_interventions:
                    curr_cost += cost
                    total_cost += cost
                    total_benefit += s["impact"]["monthly_benefit"]
                    total_net_profit += s["impact"]["net_profit_monthly"]
                    selected_interventions.append(s)

        portfolio_roi = round((total_net_profit / max(1.0, total_cost)) * 100.0, 1)
        payback_period_months = round(total_cost / max(1.0, total_benefit), 2)

        return {
            "solver_status": "OPTIMAL" if status == pywraplp.Solver.OPTIMAL else "FEASIBLE",
            "monthly_budget": monthly_budget,
            "allocated_cost": round(total_cost, 2),
            "remaining_budget": round(monthly_budget - total_cost, 2),
            "total_monthly_benefit": round(total_benefit, 2),
            "total_net_profit_monthly": round(total_net_profit, 2),
            "portfolio_roi_percentage": portfolio_roi,
            "payback_period_months": payback_period_months,
            "selected_interventions_count": len(selected_interventions),
            "selected_interventions": selected_interventions
        }
