from pathlib import Path
from .core import visualize_dataset

def main():
    # Example usage:
    # Need to pass paths as arguments or configure via settings
    base_dir = Path(__file__).resolve().parents[3]
    processed_dir = base_dir / "processed-datasets"
    
    # Iterate through processed datasets
    for ds_path in processed_dir.iterdir():
        if ds_path.is_dir():
            data_file = ds_path / "data.csv"
            if data_file.exists():
                visualize_dataset(data_file, ds_path / "plots")
