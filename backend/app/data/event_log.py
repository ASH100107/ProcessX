"""
Event Log Data Generator for ProcessX
Generates realistic enterprise order fulfillment event logs with injected bottleneck scenarios.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
from typing import Dict, List, Optional, Tuple

STAGES = [
    "Order Received",
    "Payment Verification",
    "Inventory Check",
    "Order Packing",
    "Shipping Preparation",
    "Shipment Dispatch"
]

STAGE_CONFIG = {
    "Order Received": {
        "order": 1,
        "sla_target": 5.0,
        "base_queue": (0.5, 0.4),
        "base_proc": (1.2, 0.5),
        "team": "Ingestion Gateway Team",
        "utilization_range": (0.35, 0.55),
    },
    "Payment Verification": {
        "order": 2,
        "sla_target": 15.0,
        "base_queue": (3.0, 1.2),
        "base_proc": (5.5, 1.8),
        "team": "Fraud & Finance Ops",
        "utilization_range": (0.50, 0.70),
    },
    "Inventory Check": {
        "order": 3,
        "sla_target": 10.0,
        "base_queue": (1.5, 0.6),
        "base_proc": (3.5, 1.0),
        "team": "Warehouse Stock Control",
        "utilization_range": (0.40, 0.60),
    },
    "Order Packing": {
        "order": 4,
        "sla_target": 25.0,
        "base_queue": (4.5, 1.8),
        "base_proc": (10.0, 3.0),
        "team": "Fulfillment Station Alpha",
        "utilization_range": (0.55, 0.75),
    },
    "Shipping Preparation": {
        "order": 5,
        "sla_target": 15.0,
        "base_queue": (2.0, 0.8),
        "base_proc": (4.5, 1.5),
        "team": "Logistics Dispatch Hub",
        "utilization_range": (0.45, 0.65),
    },
    "Shipment Dispatch": {
        "order": 6,
        "sla_target": 20.0,
        "base_queue": (3.0, 1.0),
        "base_proc": (7.0, 2.0),
        "team": "Carrier Transfer Ops",
        "utilization_range": (0.40, 0.60),
    }
}

REGIONS = ["North America", "Europe", "Asia-Pacific", "Latin America"]
PRIORITIES = ["Standard", "High", "Urgent"]
PRIORITY_WEIGHTS = [0.70, 0.22, 0.08]

def generate_process_data(
    num_cases: int = 2000,
    scenario: str = "payment_verification_bottleneck",
    seed: int = 42
) -> pd.DataFrame:
    """
    Generate synthetic event-log dataset.
    2000 cases * 6 stages = 12,000 process events.
    
    Supported scenarios:
    - 'normal': Baseline optimal flow, minimal queueing.
    - 'payment_verification_bottleneck': Severe queue surge & manual reviews in Payment Verification.
    - 'packing_bottleneck': Material shortage & capacity crisis in Order Packing.
    - 'unknown_inventory_bottleneck': Unannounced scanner failure & inventory mismatch in Inventory Check.
    """
    random.seed(seed)
    np.random.seed(seed)
    
    base_time = datetime(2026, 8, 1, 8, 0, 0)
    events = []
    
    for case_idx in range(1, num_cases + 1):
        case_id = f"CASE-{case_idx:05d}"
        customer_id = f"CUST-{random.randint(1000, 9999)}"
        region = random.choice(REGIONS)
        priority = random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS)[0]
        
        # Order value log-normal distribution
        if priority == "Urgent":
            order_value = round(float(np.random.lognormal(mean=6.5, sigma=0.6)), 2)
        elif priority == "High":
            order_value = round(float(np.random.lognormal(mean=5.5, sigma=0.7)), 2)
        else:
            order_value = round(float(np.random.lognormal(mean=4.5, sigma=0.8)), 2)
        order_value = max(19.99, min(order_value, 9999.00))
        
        # Case start timestamp with Poisson arrival pattern
        arrival_offset_mins = case_idx * 3.5 + np.random.exponential(scale=2.0)
        current_stage_time = base_time + timedelta(minutes=arrival_offset_mins)
        
        for stage_idx, stage_name in enumerate(STAGES):
            cfg = STAGE_CONFIG[stage_name]
            sla_target = cfg["sla_target"]
            team = cfg["team"]
            
            # Base normal parameters
            queue_mu, queue_sigma = cfg["base_queue"]
            proc_mu, proc_sigma = cfg["base_proc"]
            util_low, util_high = cfg["utilization_range"]
            
            # Priority modifier
            if priority == "Urgent":
                queue_mu *= 0.6
                proc_mu *= 0.85
            elif priority == "High":
                queue_mu *= 0.8
            
            delay_cause = "None"
            
            # SCENARIO INJECTION LOGIC
            if scenario == "payment_verification_bottleneck" and stage_name == "Payment Verification":
                # Severe bottleneck injected
                is_affected = (case_idx % 10 < 8)  # 80% of cases affected
                if is_affected:
                    queue_surge = np.random.uniform(14.0, 32.0)
                    proc_surge = np.random.uniform(8.0, 18.0)
                    queue_mu += queue_surge
                    proc_mu += proc_surge
                    util_low = 0.88
                    util_high = 0.99
                    
                    causes = ["High Queue", "Manual Processing", "Resource Shortage", "Peak Workload"]
                    weights = [0.45, 0.30, 0.15, 0.10]
                    delay_cause = random.choices(causes, weights=weights)[0]
                else:
                    delay_cause = "None"
                    
            elif scenario == "packing_bottleneck" and stage_name == "Order Packing":
                # Packing station overload injected
                is_affected = (case_idx % 10 < 8)
                if is_affected:
                    queue_surge = np.random.uniform(16.0, 38.0)
                    proc_surge = np.random.uniform(12.0, 24.0)
                    queue_mu += queue_surge
                    proc_mu += proc_surge
                    util_low = 0.90
                    util_high = 0.98
                    
                    causes = ["Resource Shortage", "High Queue", "Peak Workload", "External Dependency"]
                    weights = [0.40, 0.35, 0.15, 0.10]
                    delay_cause = random.choices(causes, weights=weights)[0]
                    
            elif scenario == "unknown_inventory_bottleneck" and stage_name == "Inventory Check":
                # Unknown / Dynamic bottleneck injected (warehouse scanner lock / inventory mismatch)
                is_affected = (case_idx % 10 < 8)
                if is_affected:
                    queue_surge = np.random.uniform(12.0, 28.0)
                    proc_surge = np.random.uniform(10.0, 20.0)
                    queue_mu += queue_surge
                    proc_mu += proc_surge
                    util_low = 0.85
                    util_high = 0.97
                    
                    causes = ["Inventory Mismatch", "System Delay", "High Queue", "Resource Shortage"]
                    weights = [0.45, 0.35, 0.12, 0.08]
                    delay_cause = random.choices(causes, weights=weights)[0]

            # Sample queue time and processing time
            queue_time = max(0.1, float(np.random.normal(queue_mu, queue_sigma)))
            processing_time = max(0.2, float(np.random.normal(proc_mu, proc_sigma)))
            duration = round(queue_time + processing_time, 2)
            queue_time = round(queue_time, 2)
            processing_time = round(processing_time, 2)
            
            # Utilization & queue length
            utilization = round(float(np.random.uniform(util_low, util_high)), 3)
            queue_length = max(1, int(queue_time * np.random.uniform(1.8, 3.2)))
            
            # SLA violation
            sla_violation = duration > sla_target
            
            # Status determination
            if sla_violation:
                status = "SLA_VIOLATED"
            elif duration > sla_target * 0.85:
                status = "DELAYED"
            else:
                status = "COMPLETED"
                
            # Fallback delay cause assignment if violated but unmarked
            if sla_violation and delay_cause == "None":
                if queue_time > processing_time * 1.5:
                    delay_cause = "High Queue"
                elif utilization > 0.80:
                    delay_cause = "Resource Shortage"
                else:
                    delay_cause = "Peak Workload"
            elif not sla_violation and delay_cause != "None" and random.random() < 0.7:
                delay_cause = "None"
            
            # Timestamps
            stage_start_time = current_stage_time + timedelta(minutes=queue_time)
            stage_end_time = stage_start_time + timedelta(minutes=processing_time)
            
            prev_stage = STAGES[stage_idx - 1] if stage_idx > 0 else None
            next_stage = STAGES[stage_idx + 1] if stage_idx < len(STAGES) - 1 else None
            
            event = {
                "case_id": case_id,
                "customer_id": customer_id,
                "timestamp": current_stage_time.isoformat(),
                "stage": stage_name,
                "stage_order": cfg["order"],
                "stage_start_time": stage_start_time.isoformat(),
                "stage_end_time": stage_end_time.isoformat(),
                "duration": duration,
                "queue_time": queue_time,
                "processing_time": processing_time,
                "status": status,
                "priority": priority,
                "order_value": order_value,
                "region": region,
                "employee_team": team,
                "resource_utilization": utilization,
                "queue_length": queue_length,
                "previous_stage": prev_stage,
                "next_stage": next_stage,
                "sla_target": sla_target,
                "sla_violation": sla_violation,
                "delay_cause": delay_cause,
                "scenario": scenario
            }
            events.append(event)
            
            # Advance time for next stage
            current_stage_time = stage_end_time + timedelta(minutes=np.random.uniform(0.2, 1.0))
            
    df = pd.DataFrame(events)
    return df
