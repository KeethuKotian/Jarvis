import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional

from backend.app.ml.preprocessor import normalize_text
from backend.app.config import settings
from backend.app.utils.logger import logger

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = BASE_DIR / "models" / "intent_classifier.joblib"

LOCAL_TOOL_INTENTS = {
    "OPEN_APPLICATION",
    "SEARCH_FILES",
    "READ_DOCUMENT",
    "SET_REMINDER",
    "VIEW_REMINDERS",
    "SYSTEM_CONTROL"
}

LLM_INTENTS = {
    "ANSWER_QUESTION",
    "GENERAL_CHAT",
    "WEB_SEARCH",
    "UNKNOWN"
}

class IntentPredictor:
    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path or MODEL_PATH
        self.pipeline = None
        self.classes = []
        self.threshold = settings.CONFIDENCE_THRESHOLD
        self._load_model()
        
    def _load_model(self):
        if self.model_path.exists():
            try:
                artifact = joblib.load(self.model_path)
                self.pipeline = artifact["pipeline"]
                self.classes = artifact["classes"]
                self.threshold = artifact.get("calibrated_threshold", settings.CONFIDENCE_THRESHOLD)
                logger.info("Loaded Intent Classifier model with %d classes, threshold=%.2f", len(self.classes), self.threshold)
            except Exception as e:
                logger.error("Failed to load intent classifier artifact: %s", e)
                self.pipeline = None
        else:
            logger.warning("Model artifact not found at %s. Please run train_model.py first.", self.model_path)
            self.pipeline = None

    def predict(self, text: str) -> Dict[str, Any]:
        """Classifies raw text and returns intent, confidence, class probabilities, and routing decision."""
        clean = normalize_text(text)
        
        # If model is not loaded, fallback to default UNKNOWN
        if self.pipeline is None:
            return {
                "normalized_text": clean,
                "intent": "UNKNOWN",
                "confidence": 0.0,
                "probabilities": {},
                "routing_decision": "GEMINI_FALLBACK",
                "recommended_action": "route_to_gemini"
            }
            
        probs = self.pipeline.predict_proba([clean])[0]
        max_idx = np.argmax(probs)
        predicted_intent = self.classes[max_idx]
        confidence = float(probs[max_idx])
        
        prob_dict = {
            cls: float(round(p, 4))
            for cls, p in zip(self.classes, probs)
        }
        
        # Routing policy logic:
        # 1. High confidence & Local Tool Intent -> LOCAL_TOOL
        # 2. System Control consequential actions require confirmation
        # 3. Low confidence (< threshold) -> GEMINI_FALLBACK or CLARIFY
        # 4. LLM intents (general chat, answer question, web search) -> GEMINI_FALLBACK
        if confidence >= self.threshold:
            if predicted_intent == "SYSTEM_CONTROL":
                # High confidence system control
                routing_decision = "LOCAL_TOOL"
                recommended_action = "execute_system_tool"
            elif predicted_intent in LOCAL_TOOL_INTENTS:
                routing_decision = "LOCAL_TOOL"
                recommended_action = f"execute_{predicted_intent.lower()}"
            elif predicted_intent == "WEB_SEARCH":
                routing_decision = "LOCAL_TOOL" # Backend DuckDuckGo tool
                recommended_action = "execute_web_search"
            else:
                routing_decision = "GEMINI_FALLBACK"
                recommended_action = "route_to_gemini"
        else:
            # Below calibrated confidence threshold
            routing_decision = "GEMINI_FALLBACK"
            recommended_action = "route_to_gemini_disambiguation"
            
        return {
            "normalized_text": clean,
            "intent": predicted_intent,
            "confidence": round(confidence, 4),
            "probabilities": prob_dict,
            "routing_decision": routing_decision,
            "recommended_action": recommended_action
        }

predictor = IntentPredictor()
