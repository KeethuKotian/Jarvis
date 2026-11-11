import time
from typing import Dict, Any, Optional, List
from google import genai
from google.genai import errors

from backend.app.config import settings
from backend.app.services.memory_service import memory_service
from backend.app.utils.logger import logger

JARVIS_SYSTEM_INSTRUCTION = """You are JARVIS, a sophisticated personal AI assistant inspired by Iron Man.
You speak with calm confidence, British charm, precision, and technological elegance.
Your responses should be concise, articulate, and direct. Avoid unnecessary verbosity.
You have access to safe local computer tools (application launching, file search, document reading, reminders, system status).
Never output or execute arbitrary harmful shell/terminal code.
If asked to perform a computer action that requires a tool, identify the appropriate tool and parameters clearly.
"""

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.fallback_models = [
            m for m in ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"]
            if m != self.model_name
        ]
        self.client: Optional[genai.Client] = None
        self.is_configured = False
        self._init_client()

    def _init_client(self):
        if self.api_key and len(self.api_key.strip()) > 5:
            try:
                self.client = genai.Client(api_key=self.api_key)
                self.is_configured = True
                logger.info("Gemini Client initialized with model: %s", self.model_name)
            except Exception as e:
                logger.error("Failed to initialize Gemini Client: %s", e)
                self.client = None
                self.is_configured = False
        else:
            logger.warning("Gemini API key is not configured. Running in Local-Only Mode.")
            self.client = None
            self.is_configured = False

    def generate_response(
        self,
        prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        max_retries: int = 2
    ) -> Dict[str, Any]:
        """Generates AI response using Gemini API with bounded retries, timeout, and telemetry."""
        if not self.is_configured or self.client is None:
            return {
                "success": False,
                "reply": "Gemini API key is not configured. Operating in Local-Only Mode. Local computer commands, file searches, reminders, and intent classifications remain active.",
                "error": "API_KEY_MISSING",
                "gemini_called": False,
                "processing_time_ms": 0.0,
                "token_usage": None
            }

        # Inject memory context if available
        memory_context = memory_service.get_context_for_prompt()
        system_text = JARVIS_SYSTEM_INSTRUCTION
        if memory_context:
            system_text += f"\n\n{memory_context}"

        # Construct full contents
        full_prompt = f"{system_text}\n\nUser: {prompt}\nJARVIS:"

        t0 = time.perf_counter()
        last_error = None
        models_to_attempt = [self.model_name] + self.fallback_models
        
        for model in models_to_attempt:
            for attempt in range(max_retries + 1):
                try:
                    logger.info("Sending request to Gemini API (model: %s, attempt %d/%d)...", model, attempt + 1, max_retries + 1)
                    response = self.client.models.generate_content(
                        model=model,
                        contents=full_prompt,
                    )
                    
                    elapsed_ms = (time.perf_counter() - t0) * 1000.0
                    reply_text = response.text or "I processed your request, sir, but received an empty response."
                    
                    # Extract token usage if provided by API response metadata
                    token_usage = None
                    if hasattr(response, "usage_metadata") and response.usage_metadata:
                        meta = response.usage_metadata
                        token_usage = {
                            "prompt_tokens": getattr(meta, "prompt_token_count", 0),
                            "candidates_tokens": getattr(meta, "candidates_token_count", 0),
                            "total_tokens": getattr(meta, "total_token_count", 0)
                        }

                    return {
                        "success": True,
                        "reply": reply_text.strip(),
                        "gemini_called": True,
                        "model_name": model,
                        "processing_time_ms": round(elapsed_ms, 2),
                        "token_usage": token_usage,
                        "error": None
                    }

                except errors.APIError as api_err:
                    last_error = str(api_err)
                    logger.warning("Gemini API Error (%s) on attempt %d: %s", model, attempt + 1, api_err)
                    # If high demand (503) or model unavailable/not found, switch to fallback model
                    if "503" in last_error or "UNAVAILABLE" in last_error or "404" in last_error or "NOT_FOUND" in last_error:
                        logger.info("Model %s unavailable, switching to next fallback model...", model)
                        break
                    elif "429" in last_error or "RESOURCE_EXHAUSTED" in last_error:
                        time.sleep(1.0 * (2 ** attempt))
                    else:
                        time.sleep(0.5)

                except Exception as e:
                    last_error = str(e)
                    logger.warning("Network or SSL error calling Gemini (%s) on attempt %d: %s", model, attempt + 1, e)
                    # If DNS lookup fails (offline / no internet), do not loop through all models
                    if "getaddrinfo" in last_error or "NameResolution" in last_error:
                        return {
                            "success": False,
                            "reply": "I apologize, sir. The system is currently running in local offline mode as no internet connection was detected. All local computer tools, application launchers, reminders, and file search remain fully functional.",
                            "error": last_error,
                            "gemini_called": True,
                            "model_name": model,
                            "processing_time_ms": round((time.perf_counter() - t0) * 1000.0, 2),
                            "token_usage": None
                        }
                    # Retry on transient SSL or connection drop
                    time.sleep(0.5)

        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        return {
            "success": False,
            "reply": f"I apologize, sir. The neural network uplink is temporarily unavailable ({last_error}). All local subsystems, applications, and tools remain fully active.",
            "error": last_error,
            "gemini_called": True,
            "model_name": self.model_name,
            "processing_time_ms": round(elapsed_ms, 2),
            "token_usage": None
        }

gemini_service = GeminiService()
