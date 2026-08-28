import pytest
import pandas as pd
from backend.app.data.event_log import generate_process_data, STAGES, STAGE_CONFIG

def test_data_generation_event_count():
    df = generate_process_data(num_cases=50, scenario="normal", seed=42)
    assert len(df) == 50 * len(STAGES)
    assert set(df["stage"].unique()) == set(STAGES)
    assert "duration" in df.columns
    assert "queue_time" in df.columns
    assert "processing_time" in df.columns
    assert "sla_violation" in df.columns
    assert "resource_utilization" in df.columns

def test_payment_bottleneck_scenario_injection():
    df = generate_process_data(num_cases=100, scenario="payment_verification_bottleneck", seed=101)
    pay_df = df[df["stage"] == "Payment Verification"]
    normal_df = generate_process_data(num_cases=100, scenario="normal", seed=42)
    pay_normal_df = normal_df[normal_df["stage"] == "Payment Verification"]
    
    # Bottleneck should have higher average duration and SLA violation rate
    assert pay_df["duration"].mean() > pay_normal_df["duration"].mean()
    assert pay_df["sla_violation"].mean() > pay_normal_df["sla_violation"].mean()

def test_packing_bottleneck_scenario_injection():
    df = generate_process_data(num_cases=100, scenario="packing_bottleneck", seed=202)
    pack_df = df[df["stage"] == "Order Packing"]
    normal_df = generate_process_data(num_cases=100, scenario="normal", seed=42)
    pack_normal = normal_df[normal_df["stage"] == "Order Packing"]
    
    assert pack_df["duration"].mean() > pack_normal["duration"].mean()
    assert pack_df["resource_utilization"].mean() > pack_normal["resource_utilization"].mean()

def test_unknown_inventory_bottleneck_scenario():
    df = generate_process_data(num_cases=100, scenario="unknown_inventory_bottleneck", seed=303)
    inv_df = df[df["stage"] == "Inventory Check"]
    normal_df = generate_process_data(num_cases=100, scenario="normal", seed=42)
    inv_normal = normal_df[normal_df["stage"] == "Inventory Check"]
    
    assert inv_df["duration"].mean() > inv_normal["duration"].mean()
    assert inv_df["sla_violation"].mean() > inv_normal["sla_violation"].mean()
