from pathlib import Path
from .core import extract_all

def main():
    base_dir = Path(__file__).resolve().parents[3]
    raw_root = base_dir / "data-sets-raw"
    processed_root = base_dir / "processed-datasets"
    
    extract_all(raw_root, processed_root)
