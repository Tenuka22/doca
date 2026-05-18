import matplotlib.pyplot as plt
import pandas as pd
from pathlib import Path

def visualize_dataset(data_path: Path, output_path: Path):
    """
    Reads a processed data.csv and creates basic plots.
    """
    if not data_path.exists():
        print(f"File not found: {data_path}")
        return
    
    df = pd.read_csv(data_path)
    print(f"Visualizing {data_path}")
    
    # Ensure plot directory exists
    output_path.mkdir(exist_ok=True, parents=True)
    
    # Example visualization: histogram of numerical columns
    numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns
    for col in numeric_cols:
        plt.figure(figsize=(10, 6))
        df[col].hist()
        plt.title(f"Distribution of {col}")
        plt.savefig(output_path / f"{col}_hist.png")
        plt.close()
        print(f"Saved plot to {output_path / f'{col}_hist.png'}")
