import json
import time
import joblib
import numpy as np
from pathlib import Path
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    classification_report,
    confusion_matrix
)
from backend.app.ml.preprocessor import normalize_text
from backend.app.utils.logger import logger

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = BASE_DIR / "models" / "intent_classifier.joblib"
SPLIT_PATH = BASE_DIR / "models" / "dataset_splits.json"
EVAL_RESULTS_PATH = BASE_DIR / "models" / "evaluation_results.json"

def evaluate():
    logger.info("Evaluating model on held-out test data...")
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model artifact not found at {MODEL_PATH}")
    if not SPLIT_PATH.exists():
        raise FileNotFoundError(f"Dataset splits not found at {SPLIT_PATH}")
        
    artifact = joblib.load(MODEL_PATH)
    pipeline = artifact["pipeline"]
    classes = artifact["classes"]
    
    with open(SPLIT_PATH, "r", encoding="utf-8") as f:
        splits = json.load(f)
        
    test_samples = splits["test"]
    X_test = [normalize_text(s["text"]) for s in test_samples]
    y_test = [s["intent"] for s in test_samples]
    
    # Measure inference latency
    latencies = []
    y_pred = []
    y_conf = []
    
    for text in X_test:
        t0 = time.perf_counter()
        probs = pipeline.predict_proba([text])[0]
        pred_idx = np.argmax(probs)
        pred_class = pipeline.classes_[pred_idx]
        conf = float(probs[pred_idx])
        latency_ms = (time.perf_counter() - t0) * 1000.0
        
        latencies.append(latency_ms)
        y_pred.append(pred_class)
        y_conf.append(conf)
        
    avg_latency = float(np.mean(latencies))
    p95_latency = float(np.percentile(latencies, 95))
    
    # Calculate real metrics
    acc = float(accuracy_score(y_test, y_pred))
    macro_f1 = float(f1_score(y_test, y_pred, average='macro', zero_division=0))
    report = classification_report(y_test, y_pred, target_names=classes, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_test, y_pred, labels=classes).tolist()
    
    # Track misclassified requests
    misclassified = []
    for i, (actual, predicted, text, conf) in enumerate(zip(y_test, y_pred, test_samples, y_conf)):
        if actual != predicted:
            misclassified.append({
                "query": text["text"],
                "actual_intent": actual,
                "predicted_intent": predicted,
                "confidence": round(conf, 4)
            })
            
    eval_results = {
        "dataset_split": "held_out_test_set",
        "total_test_samples": len(y_test),
        "accuracy": round(acc, 4),
        "macro_f1": round(macro_f1, 4),
        "average_latency_ms": round(avg_latency, 3),
        "p95_latency_ms": round(p95_latency, 3),
        "calibrated_threshold": artifact.get("calibrated_threshold", 0.65),
        "per_class_metrics": {
            cls: {
                "precision": round(report[cls]["precision"], 4),
                "recall": round(report[cls]["recall"], 4),
                "f1-score": round(report[cls]["f1-score"], 4),
                "support": int(report[cls]["support"])
            }
            for cls in classes if cls in report
        },
        "classes": classes,
        "confusion_matrix": cm,
        "misclassifications_count": len(misclassified),
        "misclassifications": misclassified,
        "limitations_analysis": [
            "Intent classifier relies on unigram and bigram TF-IDF patterns; highly complex multi-clause instructions require Gemini LLM fallback.",
            "Short ambiguous queries (e.g. single words) may lack n-gram context and fall below the calibrated confidence threshold.",
            "Out-of-vocabulary or novel domain slang is routed to Gemini API for reasoning rather than executing potentially unintended computer tools."
        ]
    }
    
    with open(EVAL_RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(eval_results, f, indent=2)
        
    logger.info("Evaluation Complete. Test Accuracy: %.4f | Macro F1: %.4f | Avg Latency: %.2f ms", acc, macro_f1, avg_latency)
    return eval_results

if __name__ == "__main__":
    evaluate()
