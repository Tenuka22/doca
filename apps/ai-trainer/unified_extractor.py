from __future__ import annotations

import os
from pathlib import Path
import pandas as pd
import numpy as np

def load_wesad_signal(file_path: Path, signal_name: str) -> pd.DataFrame:
    """
    Properly loads WESAD E4 data, reconstructing timestamps.
    """
    with open(file_path, 'r') as f:
        line1 = f.readline().strip().split(',')[0]
        line2 = f.readline().strip().split(',')[0]
        if not line1 or not line2:
             return pd.DataFrame()
        start_time = float(line1)
        sample_rate = float(line2)
    
    df = pd.read_csv(file_path, header=None, skiprows=2)
    num_samples = len(df)
    times = start_time + np.arange(num_samples) / sample_rate
    df['timestamp'] = pd.to_datetime(times, unit='s')
    
    if signal_name == 'ACC':
        df.columns = ['x', 'y', 'z', 'timestamp']
    else:
        if df.shape[1] == 2:
            df.columns = [signal_name.lower(), 'timestamp']
        else:
            df.columns = [f"{signal_name.lower()}_{i}" for i in range(df.shape[1]-1)] + ['timestamp']
        
    return df

def extract_wesad_unified(raw_root: Path) -> pd.DataFrame:
    wesad_dir = raw_root / "WESAD"
    all_subject_data = []

    if not wesad_dir.exists():
        return pd.DataFrame()

    for subject_dir in sorted(p for p in wesad_dir.iterdir() if p.is_dir() and p.name.startswith("S")):
        data_dir = subject_dir / f"{subject_dir.name}_E4_Data"
        if not data_dir.exists():
            continue

        print(f"Processing WESAD subject {subject_dir.name}...")
        try:
            hr_path = data_dir / "HR.csv"
            temp_path = data_dir / "TEMP.csv"
            eda_path = data_dir / "EDA.csv"
            
            if not all(p.exists() for p in [hr_path, temp_path, eda_path]):
                continue
                
            hr = load_wesad_signal(hr_path, "HR")
            temp = load_wesad_signal(temp_path, "TEMP")
            eda = load_wesad_signal(eda_path, "EDA")
            
            if hr.empty or temp.empty or eda.empty:
                continue

            hr.set_index('timestamp', inplace=True)
            temp.set_index('timestamp', inplace=True)
            eda.set_index('timestamp', inplace=True)
            
            temp = temp.resample('1s').mean()
            eda = eda.resample('1s').mean()
            
            combined = hr.join([temp, eda], how='outer').reset_index()
            combined['subject'] = subject_dir.name
            combined['dataset'] = "WESAD"
            
            # Drop rows where all sensor data is NaN
            combined.dropna(subset=['hr', 'temp', 'eda'], how='all', inplace=True)
            all_subject_data.append(combined)
        except Exception as e:
            print(f"Error processing WESAD {subject_dir.name}: {e}")

    if not all_subject_data:
        return pd.DataFrame()
    
    return pd.concat(all_subject_data, ignore_index=True)

def extract_ssaqs_unified(processed_root: Path) -> pd.DataFrame:
    ssaqs_dir = processed_root / "ssaqs"
    if not ssaqs_dir.exists():
        return pd.DataFrame()

    try:
        hrv = pd.read_csv(ssaqs_dir / "hrv.csv")
        oxygen = pd.read_csv(ssaqs_dir / "oxygen.csv")
        steps = pd.read_csv(ssaqs_dir / "steps.csv")
        stress = pd.read_csv(ssaqs_dir / "stress.csv")

        # Normalize column names
        if 'DATE' in stress.columns:
            stress.rename(columns={'DATE': 'timestamp'}, inplace=True)
        if 'STRESS_SCORE' in stress.columns:
            stress.rename(columns={'STRESS_SCORE': 'stress_level'}, inplace=True)
        if 'value' in oxygen.columns:
            oxygen.rename(columns={'value': 'spo2'}, inplace=True)

        # Convert to datetime and strip timezone where present
        for df in [hrv, oxygen, steps]:
            df['timestamp'] = pd.to_datetime(df['timestamp']).dt.tz_localize(None)

        if 'timestamp' in stress.columns:
            stress['timestamp'] = pd.to_datetime(stress['timestamp']).dt.tz_localize(None)
        elif 'DATE' in stress.columns:
            stress['timestamp'] = pd.to_datetime(stress['DATE']).dt.tz_localize(None)
        else:
            return pd.DataFrame()

        all_user_data = []
        unique_users = hrv['user_id'].unique()

        for user_id in unique_users:
            u_hrv = hrv[hrv['user_id'] == user_id].set_index('timestamp').select_dtypes(include=[np.number]).resample('5min').mean()
            u_oxy = oxygen[oxygen['user_id'] == user_id].set_index('timestamp').select_dtypes(include=[np.number]).resample('5min').mean()
            u_steps = steps[steps['user_id'] == user_id].set_index('timestamp').select_dtypes(include=[np.number]).resample('5min').sum()
            u_stress = stress[stress['user_id'] == user_id].set_index('timestamp').select_dtypes(include=[np.number]).resample('5min').mean()

            # Join them
            if 'spo2' not in u_oxy.columns:
                u_oxy['spo2'] = np.nan
            if 'steps' not in u_steps.columns:
                u_steps['steps'] = np.nan
            if 'stress_level' not in u_stress.columns:
                u_stress['stress_level'] = np.nan

            unified = u_hrv.join([u_oxy[['spo2']], u_steps[['steps']], u_stress[['stress_level']]], how='outer')
            
            # Forward fill to populate sparse sensors (like Spo2) with last known values
            # Limit to 1 hour (12 samples of 5min) to avoid stale data
            unified = unified.ffill(limit=12)
            
            unified = unified.reset_index()
            unified['user_id'] = user_id
            unified['dataset'] = "SSAQS"
            
            # Drop rows with no sensor data at all
            unified.dropna(subset=['rmssd', 'spo2', 'steps', 'stress_level'], how='all', inplace=True)
            all_user_data.append(unified)

        if not all_user_data:
            return pd.DataFrame()
        
        return pd.concat(all_user_data, ignore_index=True)
    except Exception as e:
        print(f"Error processing SSAQS: {e}")
        return pd.DataFrame()

def extract_mmash_unified(processed_root: Path) -> pd.DataFrame:
    mmash_dir = processed_root / "mmash"
    if not mmash_dir.exists():
        return pd.DataFrame()

    try:
        rr = pd.read_csv(mmash_dir / "rr.csv")
        actigraph = pd.read_csv(mmash_dir / "actigraph.csv")

        # Create proper timestamps for joining
        # In MMASH, day 1 is the first day. We'll use a dummy base date.
        def make_ts(df):
            # day is 1-based, time is HH:MM:SS
            base_date = pd.Timestamp('2020-01-01')
            offsets = pd.to_timedelta(df['day'] - 1, unit='D') + pd.to_timedelta(df['time'])
            return base_date + offsets

        rr['timestamp'] = make_ts(rr)
        actigraph['timestamp'] = make_ts(actigraph)

        # Sort for merge_asof
        rr.sort_values(['user_id', 'timestamp'], inplace=True)
        actigraph.sort_values(['user_id', 'timestamp'], inplace=True)

        all_user_data = []
        for user_id in rr['user_id'].unique():
            u_rr = rr[rr['user_id'] == user_id]
            u_act = actigraph[actigraph['user_id'] == user_id]

            # Use merge_asof to align RR intervals with the most recent Actigraph state
            # This associates every heart beat with activity metrics
            unified = pd.merge_asof(
                u_rr,
                u_act[['timestamp', 'Axis1', 'Axis2', 'Axis3', 'Steps']],
                on='timestamp',
                direction='backward'
            )
            all_user_data.append(unified)

        if not all_user_data:
            return pd.DataFrame()
        
        combined = pd.concat(all_user_data, ignore_index=True)
        combined['dataset'] = "MMASH"
        combined.drop(columns=['Unnamed: 0'], inplace=True, errors='ignore')
        
        # Drop rows where joining failed or columns are empty
        combined.dropna(subset=['ibi_s'], inplace=True)
        return combined
    except Exception as e:
        print(f"Error processing MMASH: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()

def main():
    base_dir = Path(".").resolve()
    raw_root = base_dir / "data-sets-raw"
    processed_root = base_dir / "processed-datasets"
    processed_root.mkdir(exist_ok=True)

    print("\nExtracting WESAD (Unified)...")
    wesad_df = extract_wesad_unified(raw_root)
    if not wesad_df.empty:
        wesad_df.to_csv(processed_root / "wesad_unified_prediction.csv", index=False)
        print(f"Saved WESAD unified: {len(wesad_df)} rows")

    print("\nExtracting SSAQS (Unified)...")
    ssaqs_df = extract_ssaqs_unified(processed_root)
    if not ssaqs_df.empty:
        ssaqs_df.to_csv(processed_root / "ssaqs_unified_prediction.csv", index=False)
        print(f"Saved SSAQS unified: {len(ssaqs_df)} rows")

    print("\nExtracting MMASH (Unified)...")
    mmash_df = extract_mmash_unified(processed_root)
    if not mmash_df.empty:
        mmash_df.to_csv(processed_root / "mmash_unified_prediction.csv", index=False)
        print(f"Saved MMASH unified: {len(mmash_df)} rows")

if __name__ == "__main__":
    main()
