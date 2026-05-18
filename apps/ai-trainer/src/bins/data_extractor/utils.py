import pandas as pd
import numpy as np
from pathlib import Path
from collections import defaultdict

def create_info_metadata(dir_path: Path, filename: str, columns: dict):
    with open(dir_path / f"{Path(filename).stem}_info.md", "w") as f:
        f.write(f"# File Information: {filename}\n\n")
        f.write("| Column Name | Description |\n")
        f.write("|-------------|-------------|\n")
        for col, desc in columns.items():
            f.write(f"| {col} | {desc} |\n")

def save_granular_data(df: pd.DataFrame, dataset_name: str, filename: str, base_processed_dir: Path):
    target_dir = base_processed_dir / dataset_name
    target_dir.mkdir(exist_ok=True, parents=True)
    output_path = target_dir / filename
    df.to_csv(output_path, index=False)
    create_info_metadata(target_dir, filename, {col: "Subject data" for col in df.columns})

def save_aggregated_data(aggregated_dfs: dict, dataset_name: str, base_processed_dir: Path):
    target_dir = base_processed_dir / dataset_name
    target_dir.mkdir(exist_ok=True, parents=True)
    for name, df in aggregated_dfs.items():
        output_path = target_dir / f"master_{name}.csv"
        df.to_csv(output_path, index=False)
        create_info_metadata(target_dir, f"master_{name}.csv", {col: "Aggregated data" for col in df.columns})
        print(f"Aggregated file saved: {output_path}")

def extract_wesad(raw_path: Path, processed_root: Path):
    """WESAD extraction producing granular per-user CSVs and aggregated master CSVs."""
    aggregated = defaultdict(list)
    for subject_dir in raw_path.glob("S*"):
        data_dir = subject_dir / f"{subject_dir.name}_E4_Data"
        if data_dir.exists():
            files = {"HR": "HR.csv", "EDA": "EDA.csv", "TEMP": "TEMP.csv"}
            for name, f_name in files.items():
                f_path = data_dir / f_name
                if f_path.exists():
                    df = pd.read_csv(f_path, header=None, names=["value"])
                    df['subject_id'] = subject_dir.name
                    save_granular_data(df, "WESAD", f"{subject_dir.name}_{name}.csv", processed_root)
                    aggregated[name].append(df)
    save_aggregated_data({name: pd.concat(dfs, ignore_index=True) for name, dfs in aggregated.items()}, "WESAD", processed_root)

def extract_ssaqs(raw_path: Path, processed_root: Path):
    """SSAQS extraction producing granular per-user CSVs and aggregated master CSVs."""
    aggregated = defaultdict(list)
    for subject_dir in raw_path.glob("*"):
        if subject_dir.is_dir() and subject_dir.name.isdigit():
            files = {"steps": "steps.csv", "stress": "stress.csv", "sleep": "sleep.csv"}
            for name, f_name in files.items():
                f_path = subject_dir / f_name
                if f_path.exists():
                    df = pd.read_csv(f_path)
                    df['subject_id'] = subject_dir.name
                    save_granular_data(df, "SSAQS", f"{subject_dir.name}_{name}.csv", processed_root)
                    aggregated[name].append(df)
    save_aggregated_data({name: pd.concat(dfs, ignore_index=True) for name, dfs in aggregated.items()}, "SSAQS", processed_root)

def extract_mmash(raw_path: Path, processed_root: Path):
    """MMASH extraction producing granular per-user CSVs and aggregated master CSVs."""
    data_paper_dir = raw_path / "MMASH" / "DataPaper"
    aggregated = defaultdict(list)
    for subject_dir in data_paper_dir.glob("user_*"):
        info_path = subject_dir / "user_info.csv"
        user_info = pd.read_csv(info_path).iloc[0] if info_path.exists() else None
        files = {"RR": "RR.csv", "Activity": "Activity.csv", "Sleep": "sleep.csv"}
        for name, f_name in files.items():
            f_path = subject_dir / f_name
            if f_path.exists():
                df = pd.read_csv(f_path)
                if user_info is not None:
                    for col in ['Age', 'Weight', 'Height', 'Gender']:
                        if col in user_info:
                            df[col.lower()] = user_info[col]
                df['subject_id'] = subject_dir.name
                save_granular_data(df, "MMASH", f"{subject_dir.name}_{name}.csv", processed_root)
                aggregated[name].append(df)
    save_aggregated_data({name: pd.concat(dfs, ignore_index=True) for name, dfs in aggregated.items()}, "MMASH", processed_root)
