import subprocess
import sys
from pathlib import Path

import log

DATASETS = ["swell", "wesad"]
SEQ_LENS = [30, 60, 90]


def run_module(module: str, *args: str) -> None:
    cmd = [sys.executable, "-m", module, *args]
    log.header(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=Path(__file__).resolve().parent.parent)
    if result.returncode != 0:
        log.err(f"{' '.join(cmd)} failed (exit code {result.returncode})")
        sys.exit(result.returncode)


def main() -> None:
    for dataset in DATASETS:
        run_module(f"tuning.{dataset}_optimize")
        for seq_len in SEQ_LENS:
            run_module(f"{dataset}.train_xgboost", "--seq-len", str(seq_len))


if __name__ == "__main__":
    main()
