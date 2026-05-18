from pathlib import Path
from .utils import extract_mmash, extract_wesad, extract_ssaqs

def extract_all(raw_root: Path, processed_root: Path):
    """
    Orchestrates dataset extraction.
    """
    print(f"Extracting datasets from {raw_root} to {processed_root}...")
    
    # Process MMASH
    mmash_path = raw_root / "multilevel-monitoring-of-activity-and-sleep-in-healthy-people-1.0.0"
    if mmash_path.exists():
        print(f"Processing MMASH...")
        extract_mmash(mmash_path, processed_root)
    
    # Process WESAD
    wesad_path = raw_root / "WESAD"
    if wesad_path.exists():
        print(f"Processing WESAD...")
        extract_wesad(wesad_path, processed_root)
        
    # Process SSAQS
    ssaqs_path = raw_root / "SSAQS dataset"
    if ssaqs_path.exists():
        print(f"Processing SSAQS...")
        extract_ssaqs(ssaqs_path, processed_root)
