"""
Candidate Interventions Catalog for ProcessX
"""

from typing import Dict, List, Any

INTERVENTIONS_CATALOG: Dict[str, Dict[str, Any]] = {
    "INT-PAY-01": {
        "id": "INT-PAY-01",
        "name": "Add Verification Capacity (2 Specialists)",
        "target_stage": "Payment Verification",
        "description": "Hire and onboard 2 dedicated fraud and payment verification specialists to resolve queue backlogs.",
        "monthly_cost": 4200.0,
        "queue_reduction_factor": 0.55,  # 45% reduction in queue time
        "proc_reduction_factor": 0.85,   # 15% reduction in proc time
        "utilization_relief": 0.22,
        "base_financial_benefit": 18500.0,
        "category": "STAFFING",
        "implementation_days": 7
    },
    "INT-PAY-02": {
        "id": "INT-PAY-02",
        "name": "Automate Payment Verification (AI Fast-Track)",
        "target_stage": "Payment Verification",
        "description": "Deploy automated rule/ML scoring to instant-approve low-risk orders under $200.",
        "monthly_cost": 7500.0,
        "queue_reduction_factor": 0.35,  # 65% reduction in queue time
        "proc_reduction_factor": 0.60,   # 40% reduction in proc time
        "utilization_relief": 0.35,
        "base_financial_benefit": 28400.0,
        "category": "AUTOMATION",
        "implementation_days": 14
    },
    "INT-PACK-01": {
        "id": "INT-PACK-01",
        "name": "Add 3 Fulfillment Specialists & Dual Stations",
        "target_stage": "Order Packing",
        "description": "Expand packing lines with 3 additional cross-trained workers and dual ergonomic packing tables.",
        "monthly_cost": 5800.0,
        "queue_reduction_factor": 0.50,
        "proc_reduction_factor": 0.75,
        "utilization_relief": 0.25,
        "base_financial_benefit": 22300.0,
        "category": "CAPACITY",
        "implementation_days": 5
    },
    "INT-INV-01": {
        "id": "INT-INV-01",
        "name": "RF Handheld Barcode Scanners & Live DB Sync",
        "target_stage": "Inventory Check",
        "description": "Deploy real-time cloud inventory syncing and wireless high-speed RF barcode scanners.",
        "monthly_cost": 3900.0,
        "queue_reduction_factor": 0.40,
        "proc_reduction_factor": 0.70,
        "utilization_relief": 0.20,
        "base_financial_benefit": 16800.0,
        "category": "TECHNOLOGY",
        "implementation_days": 10
    },
    "INT-GEN-01": {
        "id": "INT-GEN-01",
        "name": "Dynamic Cross-Stage Surge Staffing",
        "target_stage": "Cross-Stage",
        "description": "Cross-train idle dispatch & receiving workers to assist congested downstream stages during demand spikes.",
        "monthly_cost": 2200.0,
        "queue_reduction_factor": 0.75,
        "proc_reduction_factor": 0.90,
        "utilization_relief": 0.10,
        "base_financial_benefit": 10200.0,
        "category": "PROCESS_REDESIGN",
        "implementation_days": 3
    },
    "INT-VIP-01": {
        "id": "INT-VIP-01",
        "name": "VIP & High-Value Order Fast-Path",
        "target_stage": "Cross-Stage",
        "description": "Dedicated priority lane for High and Urgent orders to guarantee zero queue delay on top revenue cases.",
        "monthly_cost": 1500.0,
        "queue_reduction_factor": 0.60,
        "proc_reduction_factor": 0.95,
        "utilization_relief": 0.05,
        "base_financial_benefit": 12600.0,
        "category": "ROUTING",
        "implementation_days": 2
    }
}

def get_all_interventions() -> List[Dict[str, Any]]:
    return list(INTERVENTIONS_CATALOG.values())

def get_intervention_by_id(int_id: str) -> Dict[str, Any]:
    return INTERVENTIONS_CATALOG.get(int_id)
