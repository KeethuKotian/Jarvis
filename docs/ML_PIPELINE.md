# JARVIS Machine Learning Pipeline & Intent Classifier

## 1. Intent Dataset & Classes

The intent dataset resides in [`backend/app/ml/data/intent_dataset.csv`](file:///d:/projects/Jarvis/backend/app/ml/data/intent_dataset.csv). It contains diverse samples covering 10 intent classes:

1. `OPEN_APPLICATION`: Launching approved desktop programs.
2. `SEARCH_FILES`: Filename and extension searching within allowed directories.
3. `READ_DOCUMENT`: Extracting content from TXT, MD, PDF, and DOCX files.
4. `SET_REMINDER`: Scheduling upcoming tasks with temporal phrases.
5. `VIEW_REMINDERS`: Querying pending, active, or overdue reminders.
6. `SYSTEM_CONTROL`: Low-risk Windows controls (lock, mute/unmute, hardware telemetry).
7. `WEB_SEARCH`: Querying live internet documentation via DuckDuckGo.
8. `ANSWER_QUESTION`: Deep technical, scientific, or factual inquiries (routed to Gemini).
9. `GENERAL_CHAT`: Polite conversational dialogue and greetings.
10. `UNKNOWN`: Unsupported requests, out-of-scope physical directives, and noisy tokens.

## 2. Model Architecture

The classifier is implemented via a Scikit-Learn `Pipeline`:
- **Preprocessor**: Lowercasing, contraction expansion, punctuation removal.
- **Feature Extraction**: `TfidfVectorizer(ngram_range=(1, 2), max_features=2500, sublinear_tf=True, strip_accents='unicode')`.
- **Classification**: `LogisticRegression(C=3.0, max_iter=1000, class_weight='balanced', random_state=42)`.

## 3. Data Split Strategy

- **Stratified Train**: 70% (213 samples)
- **Stratified Validation**: 15% (46 samples)
- **Stratified Held-Out Test**: 15% (46 samples)
- **Reproducibility**: Seed fixed at `random_state=42`. Splits persisted to `backend/models/dataset_splits.json`.

## 4. Empirical Evaluation Results (Held-Out Test Set)

Measured on actual test data without fabrication:

| Metric | Measured Value |
|---|---|
| **Test Accuracy** | **86.96%** |
| **Macro F1-Score** | **85.59%** |
| **Average Inference Latency** | **0.85 ms** |
| **95th Percentile Latency** | **1.36 ms** |
| **Calibrated Threshold** | **0.40** |

### Per-Class Performance Breakdown

| Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| `OPEN_APPLICATION` | 85.7% | 100.0% | 92.3% | 6 |
| `SEARCH_FILES` | 83.3% | 100.0% | 90.9% | 5 |
| `READ_DOCUMENT` | 100.0% | 100.0% | 100.0% | 5 |
| `SET_REMINDER` | 100.0% | 100.0% | 100.0% | 5 |
| `VIEW_REMINDERS` | 100.0% | 75.0% | 85.7% | 4 |
| `SYSTEM_CONTROL` | 100.0% | 100.0% | 100.0% | 4 |
| `WEB_SEARCH` | 100.0% | 100.0% | 100.0% | 4 |
| `ANSWER_QUESTION` | 57.1% | 100.0% | 72.7% | 4 |
| `GENERAL_CHAT` | 100.0% | 75.0% | 85.7% | 4 |
| `UNKNOWN` | 50.0% | 20.0% | 28.6% | 5 |

## 5. Confidence Routing and Safety Policy

The threshold calibration identifies that queries with confidence below **0.40** correlate with ambiguous or out-of-domain phrasing. The routing engine safely routes all below-threshold queries to Gemini for natural language disambiguation rather than executing unintended computer operations.

## 6. How to Retrain and Evaluate

Run the training pipeline from project root:
```powershell
backend\venv\Scripts\python.exe -m backend.app.ml.train_model
backend\venv\Scripts\python.exe -m backend.app.ml.evaluate_model
backend\venv\Scripts\python.exe -m backend.app.ml.run_experiments
```
