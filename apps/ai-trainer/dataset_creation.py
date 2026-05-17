from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

pd.set_option("display.max_columns", 200)
pd.set_option("display.width", 160)
sns.set_theme(style="whitegrid")


def save_csv(df: pd.DataFrame, output_root: Path, name: str) -> Path:
    path = output_root / name
    df.to_csv(path, index=False)
    return path


def ensure_output_dir(output_root: Path, name: str) -> Path:
    path = output_root / name
    path.mkdir(exist_ok=True)
    return path


def numeric_sample(df: pd.DataFrame, value_column: str, limit: int = 2000) -> pd.DataFrame:
    sample = df[[value_column]].copy()
    sample[value_column] = pd.to_numeric(sample[value_column], errors="coerce")
    sample = sample.dropna()
    sample = sample[sample[value_column].abs() < 1_000_000]
    return sample.head(limit)


def extract_wesad_samsung(raw_root: Path) -> dict[str, pd.DataFrame]:
    wesad_dir = raw_root / "WESAD"
    grouped_frames: dict[str, list[pd.DataFrame]] = {signal: [] for signal in ["ACC", "BVP", "EDA", "HR", "IBI", "TEMP"]}

    if not wesad_dir.exists():
        return {}

    for subject_dir in sorted(p for p in wesad_dir.iterdir() if p.is_dir() and p.name.startswith("S")):
        data_dir = subject_dir / f"{subject_dir.name}_E4_Data"
        if not data_dir.exists():
            continue

        for signal_name in ["ACC", "BVP", "EDA", "HR", "IBI", "TEMP"]:
            file_path = data_dir / f"{signal_name}.csv"
            if not file_path.exists():
                continue

            frame = pd.read_csv(file_path, header=None)
            frame = frame.iloc[1:].reset_index(drop=True)
            if signal_name == "ACC" and frame.shape[1] == 3:
                frame.columns = ["x", "y", "z"]
            elif signal_name == "IBI" and frame.shape[1] == 2:
                frame.columns = ["elapsed_seconds", "ibi_seconds"]
            elif frame.shape[1] == 1:
                frame.columns = [signal_name.lower()]

            frame["signal"] = signal_name
            frame["subject"] = subject_dir.name
            frame["dataset"] = "WESAD"
            grouped_frames[signal_name].append(frame)

    return {
        signal_name: pd.concat(frames, ignore_index=True, sort=False)
        for signal_name, frames in grouped_frames.items()
        if frames
    }


def extract_ssaqs_samsung(raw_root: Path) -> dict[str, pd.DataFrame]:
    ssaqs_dir = raw_root / "SSAQS dataset"
    grouped_frames: dict[str, list[pd.DataFrame]] = {}

    if not ssaqs_dir.exists():
        return {}

    for user_dir in sorted(p for p in ssaqs_dir.iterdir() if p.is_dir() and p.name.isdigit()):
        for filename, source in [
            ("activity_level.csv", "activity_level"),
            ("daily_questions.csv", "daily_questions"),
            ("hrv.csv", "hrv"),
            ("oxygen.csv", "oxygen"),
            ("sleep.csv", "sleep"),
            ("steps.csv", "steps"),
            ("stress.csv", "stress"),
        ]:
            path = user_dir / filename
            if not path.exists():
                continue

            frame = pd.read_csv(path)
            frame["user_id"] = user_dir.name
            frame["dataset"] = "SSAQS"
            frame["source_file"] = source
            grouped_frames.setdefault(source, []).append(frame)

    return {
        source: pd.concat(frames, ignore_index=True, sort=False)
        for source, frames in grouped_frames.items()
        if frames
    }


def extract_mmash_samsung(raw_root: Path) -> dict[str, pd.DataFrame]:
    mmash_dir = raw_root / "multilevel-monitoring-of-activity-and-sleep-in-healthy-people-1.0.0" / "MMASH" / "DataPaper"
    grouped_frames: dict[str, list[pd.DataFrame]] = {}

    if not mmash_dir.exists():
        return {}

    for user_dir in sorted(p for p in mmash_dir.iterdir() if p.is_dir() and p.name.startswith("user_")):
        for filename in ["RR.csv", "sleep.csv", "Activity.csv", "Actigraph.csv"]:
            path = user_dir / filename
            if not path.exists():
                continue

            frame = pd.read_csv(path)
            frame["user_id"] = user_dir.name
            frame["source_file"] = filename
            frame["dataset"] = "MMASH"
            grouped_frames.setdefault(Path(filename).stem.lower(), []).append(frame)

    return {
        source: pd.concat(frames, ignore_index=True, sort=False)
        for source, frames in grouped_frames.items()
        if frames
    }


def save_signal_plot(df: pd.DataFrame, output_root: Path, signal_name: str, value_column: str, title: str, file_name: str):
    subset = df[df["signal"] == signal_name].copy()
    if subset.empty or value_column not in subset.columns:
        return None

    if "timestamp" in subset.columns:
        subset["timestamp"] = pd.to_datetime(subset["timestamp"], errors="coerce")
        subset = subset.dropna(subset=["timestamp"])

    sample = subset[[value_column, "subject", *(["timestamp"] if "timestamp" in subset.columns else [])]].copy()
    sample[value_column] = pd.to_numeric(sample[value_column], errors="coerce")
    sample = sample.dropna(subset=[value_column])
    sample = sample[sample[value_column].abs() < 1_000_000].head(2000)
    if sample.empty:
        return None

    plt.figure(figsize=(12, 4))
    if "timestamp" in sample.columns:
        sns.lineplot(data=sample, x="timestamp", y=value_column, hue="subject", legend=False)
    else:
        sns.lineplot(data=sample.reset_index(drop=True), x=sample.index[: len(sample)], y=value_column, hue="subject", legend=False)
    plt.title(title)
    plt.tight_layout()
    plot_dir = output_root / "plots"
    plot_dir.mkdir(exist_ok=True)
    path = plot_dir / file_name
    plt.savefig(path, dpi=160)
    plt.close()
    return path


def combine_tables(tables: dict[str, pd.DataFrame], source_type: str) -> pd.DataFrame:
    frames: list[pd.DataFrame] = []
    for name, frame in tables.items():
        combined = frame.copy()
        combined["source_type"] = source_type
        combined["source_name"] = name
        frames.append(combined)

    if not frames:
        return pd.DataFrame()

    return pd.concat(frames, ignore_index=True, sort=False)


def main() -> int:
    base_dir = Path(__file__).resolve().parent
    raw_root = base_dir / "data-sets-raw"
    output_root = base_dir / "processed-datasets"
    output_root.mkdir(exist_ok=True)
    wesad_output = ensure_output_dir(output_root, "wesad")
    ssaqs_output = ensure_output_dir(output_root, "ssaqs")
    mmash_output = ensure_output_dir(output_root, "mmash")

    wesad_tables = extract_wesad_samsung(raw_root)
    ssaqs_tables = extract_ssaqs_samsung(raw_root)
    mmash_tables = extract_mmash_samsung(raw_root)

    for signal_name, df in wesad_tables.items():
        save_csv(df, wesad_output, f"{signal_name.lower()}.csv")
    for source_name, df in ssaqs_tables.items():
        save_csv(df, ssaqs_output, f"{source_name}.csv")
    for source_name, df in mmash_tables.items():
        save_csv(df, mmash_output, f"{source_name}.csv")

    # Combined training dataset logic has been moved to unified_extractor.py
    # to handle dataset-specific schemas and prediction-ready formatting.
    
    wesad_hr_df = wesad_tables.get("HR", pd.DataFrame())
    plot_summary = {
        "wesad_hr_plot": str(save_signal_plot(wesad_hr_df, output_root, "HR", "hr", "WESAD heart rate samples", "wesad_hr.png"))
        if not wesad_hr_df.empty
        else None,
        "wesad_eda_plot": str(save_signal_plot(wesad_tables.get("EDA", pd.DataFrame()), output_root, "EDA", "eda", "WESAD EDA samples", "wesad_eda.png"))
        if not wesad_tables.get("EDA", pd.DataFrame()).empty
        else None,
        "wesad_temp_plot": str(save_signal_plot(wesad_tables.get("TEMP", pd.DataFrame()), output_root, "TEMP", "temp", "WESAD temperature samples", "wesad_temp.png"))
        if not wesad_tables.get("TEMP", pd.DataFrame()).empty
        else None,
    }
    print({
        "wesad_tables": {name: len(df) for name, df in wesad_tables.items()},
        "ssaqs_tables": {name: len(df) for name, df in ssaqs_tables.items()},
        "mmash_tables": {name: len(df) for name, df in mmash_tables.items()},
        "plots": plot_summary,
    })
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
