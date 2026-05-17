import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

def plot_wesad_sample(df: pd.DataFrame):
    print("Plotting WESAD sample...")
    subjects = df['subject'].dropna().unique()
    sample_df = df[df['subject'].isin(subjects)].copy()
    sample_df['timestamp'] = pd.to_datetime(sample_df['timestamp'])

    slices = []
    for subject in subjects:
        subject_data = sample_df[sample_df['subject'] == subject].sort_values('timestamp')
        if subject_data.empty:
            continue
        start = subject_data['timestamp'].min()
        end = start + pd.Timedelta(minutes=10)
        slices.append(subject_data[(subject_data['timestamp'] >= start) & (subject_data['timestamp'] <= end)])

    if not slices:
        return

    plot_df = pd.concat(slices, ignore_index=True)

    plt.figure(figsize=(12, 6))
    sns.lineplot(data=plot_df, x='timestamp', y='hr', hue='subject', palette='tab20')
    plt.title("WESAD: Heart Rate Comparison (10-min Sample)")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

def plot_ssaqs_sample(df: pd.DataFrame):
    print("Plotting SSAQS sample...")
    users = df['user_id'].dropna().unique()
    sample_df = df[df['user_id'].isin(users)].copy()
    sample_df['timestamp'] = pd.to_datetime(sample_df['timestamp'])
    sample_df = sample_df.sort_values('timestamp')
    
    plt.figure(figsize=(12, 6))
    sns.lineplot(data=sample_df, x='timestamp', y='steps', hue='user_id', palette='viridis')
    plt.title("SSAQS: Steps Activity per User (5-min Aggregated)")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

def plot_mmash_sample(df: pd.DataFrame):
    print("Plotting MMASH sample...")
    users = df['user_id'].dropna().unique()
    sample_df = df[df['user_id'].isin(users)].copy()
    sample_df['timestamp'] = pd.to_datetime(sample_df['timestamp'])
    sample_df = sample_df.sort_values('timestamp').head(5000)
    
    plt.figure(figsize=(12, 6))
    sns.scatterplot(data=sample_df, x='ibi_s', y='Axis1', hue='user_id', palette='tab20', s=18)
    plt.title("MMASH: RR Interval vs Activity (All Users)")
    plt.xlabel("RR Interval (seconds)")
    plt.ylabel("Movement (Axis1)")
    plt.tight_layout()
    plt.show()

def main():
    processed_dir = Path("processed-datasets")
    sns.set_theme(style="darkgrid")

    # WESAD
    wesad_path = processed_dir / "wesad_unified_prediction.csv"
    if wesad_path.exists():
        df = pd.read_csv(wesad_path)
        plot_wesad_sample(df)
    
    # SSAQS
    ssaqs_path = processed_dir / "ssaqs_unified_prediction.csv"
    if ssaqs_path.exists():
        df = pd.read_csv(ssaqs_path)
        plot_ssaqs_sample(df)

    # MMASH
    mmash_path = processed_dir / "mmash_unified_prediction.csv"
    if mmash_path.exists():
        df = pd.read_csv(mmash_path)
        plot_mmash_sample(df)

if __name__ == "__main__":
    main()
