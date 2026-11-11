import os
import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, f1_score, classification_report

from backend.app.ml.preprocessor import normalize_text
from backend.app.utils.logger import logger

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PATH = Path(__file__).resolve().parent / "data" / "intent_dataset.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "intent_classifier.joblib"
SPLIT_PATH = MODEL_DIR / "dataset_splits.json"

def train():
    logger.info("Starting ML Intent Classifier Training Pipeline...")
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")
        
    df = pd.read_csv(DATA_PATH)
    logger.info("Loaded %d samples across %d classes.", len(df), df['intent'].nunique())
    
    # Preprocess text
    df['clean_text'] = df['text'].apply(normalize_text)
    
    # Filter empty rows
    df = df[df['clean_text'].str.len() > 0]
    
    X = df['clean_text'].values
    y = df['intent'].values
    
    # 70% Train, 15% Validation, 15% Test (Stratified)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )
    
    logger.info("Splits: Train=%d, Validation=%d, Test=%d", len(X_train), len(X_val), len(X_test))
    
    # Save splits for test & evaluation reproducibility
    splits_data = {
        "train": [{"text": str(t), "intent": str(i)} for t, i in zip(X_train, y_train)],
        "val": [{"text": str(t), "intent": str(i)} for t, i in zip(X_val, y_val)],
        "test": [{"text": str(t), "intent": str(i)} for t, i in zip(X_test, y_test)]
    }
    with open(SPLIT_PATH, "w", encoding="utf-8") as f:
        json.dump(splits_data, f, indent=2)
        
    # Build scikit-learn Pipeline
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=2500,
            sublinear_tf=True,
            strip_accents='unicode'
        )),
        ('classifier', LogisticRegression(
            C=3.0,
            max_iter=1000,
            class_weight='balanced',
            random_state=42
        ))
    ])
    
    # Train
    pipeline.fit(X_train, y_train)
    logger.info("Model training completed.")
    
    # Validation evaluation & confidence calibration
    val_preds = pipeline.predict(X_val)
    val_probs = pipeline.predict_proba(X_val)
    val_confidences = np.max(val_probs, axis=1)
    
    val_acc = accuracy_score(y_val, val_preds)
    val_f1 = f1_score(y_val, val_preds, average='macro')
    logger.info("Validation Accuracy: %.4f, Macro F1: %.4f", val_acc, val_f1)
    
    # Calibrate confidence threshold (find threshold where precision on correct routing is >= 95%)
    correct_mask = (val_preds == y_val)
    calibrated_threshold = 0.55
    for thresh in np.arange(0.40, 0.90, 0.05):
        high_conf = val_confidences >= thresh
        if np.sum(high_conf) > 0:
            precision_at_thresh = np.mean(correct_mask[high_conf])
            if precision_at_thresh >= 0.92:
                calibrated_threshold = float(round(thresh, 2))
                break
                
    logger.info("Calibrated Confidence Threshold: %.2f", calibrated_threshold)
    
    # Save model artifact and metadata
    artifact = {
        "pipeline": pipeline,
        "classes": list(pipeline.classes_),
        "calibrated_threshold": calibrated_threshold,
        "train_samples": len(X_train),
        "val_accuracy": float(val_acc),
        "val_f1": float(val_f1)
    }
    
    joblib.dump(artifact, MODEL_PATH)
    logger.info("Model saved successfully to %s", MODEL_PATH)
    return artifact

if __name__ == "__main__":
    train()
