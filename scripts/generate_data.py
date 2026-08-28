"""
Generate process event logs for all scenarios and save to data/
"""

import os
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from backend.app.data.event_log import generate_process_data, STAGES

def main():
    raw_dir = BASE_DIR / "data" / "raw"
    proc_dir = BASE_DIR / "data" / "processed"
    raw_dir.mkdir(parents=True, exist_ok=True)
    proc_dir.mkdir(parents=True, exist_ok=True)
    
    scenarios = [
        ("normal", 2000, 42),
        ("payment_verification_bottleneck", 2000, 101),
        ("packing_bottleneck", 2000, 202),
        ("unknown_inventory_bottleneck", 2000, 303)
    ]
    
    all_dfs = []
    
    for sc_name, num_cases, seed in scenarios:
        print(f"[*] Generating {num_cases} cases ({num_cases * 6} events) for scenario: {sc_name}...")
        df = generate_process_data(num_cases=num_cases, scenario=sc_name, seed=seed)
        
        # Save scenario raw CSV
        out_path = raw_dir / f"events_{sc_name}.csv"
        df.to_csv(out_path, index=False)
        print(f"    Saved {len(df)} events to {out_path}")
        
        all_dfs.append(df)
        
    # Combined dataset for training & baseline modeling
    combined_df = pd.concat(all_dfs, ignore_index=True)
    combined_path = proc_dir / "events_all_scenarios.csv"
    combined_df.to_csv(combined_path, index=False)
    print(f"[+] Successfully generated combined dataset with {len(combined_df)} total events at {combined_path}")

if __name__ == "__main__":
    import pandas as pd
    main()
