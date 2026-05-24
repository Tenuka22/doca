import argparse
import json
from pathlib import Path

import numpy as np

from src.config import TRAINING
from src.data.features import create_sequences
from src.data.load import load_all_subjects
from src.evaluate.metrics import plot_correlations


def main():
    parser = argparse.ArgumentParser(description="Train WESAD LSTM stress model")
    parser.add_argument(
        "--online",
        action="store_true",
        default=False,
        help="Run model training on Modal cloud infrastructure",
    )
    args = parser.parse_args()

    print("Loading raw RRI sensor data for all subjects...")
    subjects = list(load_all_subjects())

    print(f"Loaded {len(subjects)} subjects")

    if len(subjects) > 0:
        feature_names = subjects[0][3]
        print(f"Hardware-compatible features (MAX30102): {feature_names}")
        plot_correlations(subjects[0][1], feature_names)

    train_subjects = [s for s in subjects if s[0] <= 13]
    val_subjects = [s for s in subjects if s[0] in (14, 15)]
    test_subjects = [s for s in subjects if s[0] >= 16]

    for seq_len in TRAINING.sequence_lengths:
        print(f"\n{'=' * 60}")
        print(f"Sensor sequence -> LSTM (seq_len={seq_len})")
        print(
            f"Input: ({seq_len}, {len(subjects[0][3])}) RRI features -> LSTM -> stress probability"
        )
        print(f"{'=' * 60}")

        def prepare_data(subj_list):
            all_X, all_y = [], []
            for _, v, l, _ in subj_list:
                X_sub, y_sub = create_sequences(v, l, seq_len)
                if len(X_sub) > 0:
                    all_X.append(X_sub)
                    all_y.append(y_sub)
            return np.concatenate(all_X), np.concatenate(all_y)

        X_train_seq, y_train_seq = prepare_data(train_subjects)
        X_val_seq, y_val_seq = prepare_data(val_subjects)
        X_test_seq, y_test_seq = prepare_data(test_subjects)

        print(
            f"Train sequences: {X_train_seq.shape}, Val: {X_val_seq.shape}, Test: {X_test_seq.shape}"
        )
        print(
            f"Stress ratio - Train: {y_train_seq.mean():.3f}, Val: {y_val_seq.mean():.3f}, Test: {y_test_seq.mean():.3f}"
        )

        if args.online:
            _train_online(
                seq_len,
                X_train_seq,
                y_train_seq,
                X_val_seq,
                y_val_seq,
                X_test_seq,
                y_test_seq,
            )
        else:
            _train_local(
                seq_len,
                X_train_seq,
                y_train_seq,
                X_val_seq,
                y_val_seq,
                X_test_seq,
                y_test_seq,
            )

    print(f"\nAll models saved to: {TRAINING.models_dir}")
    print(
        "\nArchitecture: [RRI sensor readings] -> sequence -> LSTM -> stress prediction"
    )


def _train_local(
    seq_len: int,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
):
    from src.evaluate.metrics import evaluate_model
    from src.training.trainer import train_model

    model = train_model(seq_len, X_train, y_train, X_val, y_val)
    report = evaluate_model(model, X_test, y_test, seq_len)
    print(f"\nClassification Report (seq_len={seq_len}):\n{report}")


def _train_online(
    seq_len: int,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
):
    from src.remote.modal_app import train_remote

    n_features = X_train.shape[2]
    print("Sending data to Modal for training...")
    artifacts = train_remote.remote(
        X_train,
        y_train,
        X_val,
        y_val,
        X_test,
        y_test,
        seq_len,
        n_features,
    )

    model_dir = TRAINING.models_dir / f"seq_{seq_len}"
    model_dir.mkdir(parents=True, exist_ok=True)

    for rel_path, data in artifacts.items():
        dst = model_dir / rel_path
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(data)
        print(f"  Downloaded: {rel_path} ({len(data)} bytes)")

    report_path = model_dir / "results.json"
    if report_path.exists():
        with open(report_path) as f:
            metrics = json.load(f)
        print(
            f"  Accuracy: {metrics['accuracy']:.4f}, "
            f"F1: {metrics['f1']:.4f}, "
            f"AUC: {metrics['auc']:.4f}"
        )


if __name__ == "__main__":
    main()
