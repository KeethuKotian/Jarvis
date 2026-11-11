from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class IntentPredictionRequest(BaseModel):
    text: str = Field(..., description="The user query to classify")

class IntentPredictionResponse(BaseModel):
    normalized_text: str
    intent: str
    confidence: float
    probabilities: Dict[str, float]
    routing_decision: str
    recommended_action: str

class MLMetricsResponse(BaseModel):
    accuracy: float
    macro_f1: float
    per_class_metrics: Dict[str, Dict[str, float]]
    confusion_matrix: List[List[int]]
    classes: List[str]
    average_latency_ms: float
    total_samples: int
