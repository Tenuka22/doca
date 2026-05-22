import numpy as np

from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import StandardScaler
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix

import log


def subject_split(X, y, groups, random_state=42):
    gss1 = GroupShuffleSplit(n_splits=1, test_size=0.3, random_state=random_state)
    train_idx, temp_idx = next(gss1.split(X, y, groups=groups))

    temp_groups = groups[temp_idx]
    gss2 = GroupShuffleSplit(n_splits=1, test_size=0.5, random_state=random_state)
    val_rel, test_rel = next(gss2.split(X[temp_idx], y[temp_idx], groups=temp_groups))

    val_idx = temp_idx[val_rel]
    test_idx = temp_idx[test_rel]

    X_train, X_val, X_test = X[train_idx], X[val_idx], X[test_idx]
    y_train, y_val, y_test = y[train_idx], y[val_idx], y[test_idx]

    train_subjects = groups[train_idx]
    val_subjects = groups[val_idx]
    test_subjects = groups[test_idx]

    return (X_train, X_val, X_test,
            y_train, y_val, y_test,
            train_subjects, val_subjects, test_subjects)


def scale_data(X_train, X_val, X_test):
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train).astype(np.float32)
    X_val_s = scaler.transform(X_val).astype(np.float32)
    X_test_s = scaler.transform(X_test).astype(np.float32)
    return X_train_s, X_val_s, X_test_s, scaler


def create_sequences(data, labels, subjects, seq_len=30, step=10):
    X_s, y_s = [], []
    for s in np.unique(subjects):
        mask = subjects == s
        X_sub = data[mask]
        y_sub = labels[mask]
        for i in range(0, len(X_sub) - seq_len + 1, step):
            X_s.append(X_sub[i : i + seq_len])
            y_s.append(y_sub[i + seq_len - 1])
    return np.array(X_s, dtype=np.float32), np.array(y_s)


def prepare_sequences(X_train_s, X_val_s, X_test_s,
                      y_train, y_val, y_test,
                      train_subjects, val_subjects, test_subjects,
                      seq_len=30, step=10):
    X_tr, y_tr = create_sequences(X_train_s, y_train, train_subjects, seq_len, step)
    X_va, y_va = create_sequences(X_val_s, y_val, val_subjects, seq_len, step)
    X_te, y_te = create_sequences(X_test_s, y_test, test_subjects, seq_len, step)
    return (X_tr, y_tr), (X_va, y_va), (X_te, y_te)


def compute_class_weights(y_train):
    classes = np.unique(y_train)
    w = compute_class_weight(class_weight="balanced", classes=classes, y=y_train)
    return dict(enumerate(w))


def make_sample_weights(y, class_weight_dict):
    return np.array([class_weight_dict[i] for i in y], dtype=np.float64)


def evaluate_model(name, model, X_test, y_test, le):
    import xgboost as xgb
    if isinstance(model, xgb.Booster):
        preds = model.predict(xgb.DMatrix(X_test))
    else:
        preds = model.predict(X_test, batch_size=256)
    if preds.ndim == 2:
        preds = preds.argmax(axis=1)

    cm = confusion_matrix(y_test, preds)
    total = cm.sum()
    correct = cm.trace()
    overall_acc = correct / total

    log.header("EVALUATION")
    log.info(f"Overall accuracy: {overall_acc:.4f}  ({correct}/{total})")

    log.info("Per-class metrics:")
    log.detail(f"{'Class':>18s}  {'Acc':>6s}  {'Prec':>6s}  {'Recall':>7s}  {'F1':>6s}  {'FP':>4s}  {'FN':>4s}  {'Support':>7s}")
    for i, cls in enumerate(le.classes_):
        tp = cm[i, i]
        fp = cm[:, i].sum() - tp
        fn = cm[i, :].sum() - tp
        n = cm[i, :].sum()
        acc_i = tp / n if n > 0 else 0.0
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
        log.detail(f"{cls:>18s}  {acc_i:>6.3f}  {prec:>6.3f}  {rec:>7.3f}  {f1:>6.3f}  {fp:>4d}  {fn:>4d}  {n:>7d}")


    return preds


def flatten_sequences(X_seq):
    n, seq_len, n_feats = X_seq.shape
    X_flat = X_seq.reshape(n, seq_len * n_feats)
    return X_flat


def aggregate_sequences(X_seq):
    n, seq_len, n_feats = X_seq.shape
    agg = np.zeros((n, n_feats * 5), dtype=np.float32)
    for i in range(n):
        agg[i, 0*n_feats:1*n_feats] = X_seq[i].mean(axis=0)
        agg[i, 1*n_feats:2*n_feats] = X_seq[i].std(axis=0)
        agg[i, 2*n_feats:3*n_feats] = X_seq[i].min(axis=0)
        agg[i, 3*n_feats:4*n_feats] = X_seq[i].max(axis=0)
        agg[i, 4*n_feats:5*n_feats] = X_seq[i][-1] - X_seq[i][0]
    return agg


SEQ_LEN = 30
STEP = 10
RANDOM_STATE = 42
EPOCHS = 30
BATCH_SIZE = 256
PATIENCE = 5
LR = 5e-4
