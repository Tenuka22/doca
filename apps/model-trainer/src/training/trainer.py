from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from sklearn.utils.class_weight import compute_class_weight
from tensorflow.keras import Model

from src.config import TRAINING

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _validate_inputs(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    seq_len: int,
) -> None:
    """Raise early with a clear message if shapes are wrong."""
    if X_train.ndim != 3:
        raise ValueError(
            f"X_train must be 3-D (samples, timesteps, features), got {X_train.shape}"
        )
    if X_train.shape[1] != seq_len:
        raise ValueError(
            f"X_train timesteps ({X_train.shape[1]}) != seq_len ({seq_len})"
        )
    if X_train.shape[0] != y_train.shape[0]:
        raise ValueError(
            f"X_train / y_train sample count mismatch: {X_train.shape[0]} vs {y_train.shape[0]}"
        )
    if X_val.shape[2] != X_train.shape[2]:
        raise ValueError(
            f"Feature count mismatch: train={X_train.shape[2]}, val={X_val.shape[2]}"
        )


def _compute_class_weights(y: np.ndarray) -> dict[int, float] | None:
    """
    Return balanced class weights, or None if only one class is present
    (which would crash sklearn and indicates a data problem worth logging).
    """
    classes = np.unique(y)
    if len(classes) < 2:
        logger.warning("Only one class found in y_train — skipping class weighting.")
        return None
    weights = compute_class_weight(class_weight="balanced", classes=classes, y=y)
    return dict(zip(classes.tolist(), weights.tolist()))


def _build_callbacks() -> list[tf.keras.callbacks.Callback]:
    return [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=TRAINING.patience,  # was 1 — way too aggressive
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=TRAINING.reduce_lr_factor,
            patience=TRAINING.reduce_lr_patience,  # was 1 — triggered every epoch
            min_lr=TRAINING.min_lr,
            verbose=1,
        ),
    ]


def _save_training_curves(
    history: tf.keras.callbacks.History,
    model_dir: Path,
) -> None:
    """Plot loss + accuracy curves and save to disk. Silently logs on failure."""
    try:
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))

        ax1.plot(history.history["loss"], label="train")
        ax1.plot(history.history["val_loss"], label="val")
        ax1.set_title("Loss")
        ax1.set_xlabel("Epoch")
        ax1.legend()

        ax2.plot(history.history["accuracy"], label="train")
        ax2.plot(history.history["val_accuracy"], label="val")
        ax2.set_title("Accuracy")
        ax2.set_xlabel("Epoch")
        ax2.legend()

        plt.tight_layout()
        out = model_dir / "training_curves.png"
        plt.savefig(out, dpi=150)
        logger.info("Saved training curves → %s", out)
    except Exception:
        logger.exception("Failed to save training curves — continuing.")
    finally:
        plt.close("all")


def _save_model(model: Model, model_dir: Path) -> None:
    out = model_dir / "model.keras"
    model.save(str(out))
    logger.info("Saved Keras model → %s", out)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def train_model(
    seq_len: int,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
) -> tuple[Model, tf.keras.callbacks.History]:
    """
    Train an LSTM for the given sequence length.

    Returns
    -------
    model   : best weights restored by EarlyStopping
    history : raw Keras History object (useful for upstream reporting)
    """
    # --- lazy import keeps the module testable without TF / custom modules ---
    from src.models.lstm import build_rri_lstm
    from src.training.export import export_to_onnx

    _validate_inputs(X_train, y_train, X_val, y_val, seq_len)

    n_features = X_train.shape[2]
    model_dir = TRAINING.model_dir(seq_len)

    logger.info(
        "Training seq_len=%d | samples=%d | features=%d | dir=%s",
        seq_len,
        len(X_train),
        n_features,
        model_dir,
    )

    model = build_rri_lstm(seq_len, n_features)
    class_weight = _compute_class_weights(y_train)

    history = model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=TRAINING.epochs,
        batch_size=TRAINING.batch_size,
        class_weight=class_weight,
        callbacks=_build_callbacks(),
        verbose=1,
    )

    _save_training_curves(history, model_dir)
    export_to_onnx(model, seq_len, n_features, model_dir)
    _save_model(model, model_dir)

    stopped_at = len(history.history["loss"])
    logger.info("Finished seq_len=%d after %d epochs.", seq_len, stopped_at)

    return model, history
