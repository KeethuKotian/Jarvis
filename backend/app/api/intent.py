import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from backend.app.schemas.intent import IntentPredictionRequest, IntentPredictionResponse
from backend.app.ml.predictor import predictor

router = APIRouter(prefix="/api/intent", tags=["Intent Classification"])

EVAL_PATH = Path(__file__).resolve().parent.parent.parent / "models" / "evaluation_results.json"

@router.post("/predict", response_model=IntentPredictionResponse)
def predict_intent(request: IntentPredictionRequest):
    """Returns the intent classification, confidence score, and full probability distribution for a text prompt."""
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
        
    result = predictor.predict(request.text)
    return result

@router.get("/metrics")
def get_ml_metrics():
    """Returns the empirical evaluation metrics computed on held-out test data."""
    if not EVAL_PATH.exists():
        raise HTTPException(status_code=404, detail="Evaluation results not found. Please run evaluate_model.py first.")
        
    with open(EVAL_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data
