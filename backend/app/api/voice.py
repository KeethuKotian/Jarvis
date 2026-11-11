from fastapi import APIRouter, UploadFile, File, HTTPException
from google import genai
from google.genai import types

from backend.app.config import settings
from backend.app.services.gemini_service import gemini_service
from backend.app.utils.logger import logger

router = APIRouter(prefix="/api/voice", tags=["Voice & Audio"])

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribes user spoken audio using Gemini's native multimodal audio understanding."""
    if not gemini_service.is_configured or not gemini_service.client:
        raise HTTPException(
            status_code=503,
            detail="Gemini API is not configured for cloud audio transcription. Please ensure Web Speech API is active."
        )

    try:
        audio_bytes = await audio.read()
        if not audio_bytes or len(audio_bytes) < 100:
            raise HTTPException(status_code=400, detail="Audio recording too short or empty.")

        content_type = audio.content_type or "audio/webm"
        # Standardize webm audio format for Gemini
        if "webm" in content_type:
            mime = "audio/webm"
        elif "wav" in content_type:
            mime = "audio/wav"
        elif "ogg" in content_type:
            mime = "audio/ogg"
        else:
            mime = "audio/webm"

        logger.info("Transcribing audio payload (%d bytes, mime: %s)...", len(audio_bytes), mime)

        models_to_try = [settings.GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-flash-latest"]
        last_error = None

        for model_candidate in models_to_try:
            try:
                response = gemini_service.client.models.generate_content(
                    model=model_candidate,
                    contents=[
                        types.Part.from_bytes(data=audio_bytes, mime_type=mime),
                        "Transcribe the user's spoken words in this audio recording accurately. Fix any small acoustic mishearings or stutters while preserving the user's exact words, file paths, application names, and sentence intent. Output ONLY the clean transcribed sentence without quotes, notes, or commentary."
                    ]
                )

                raw_text = (response.text or "").strip()
                # Clean up wrapping quotes or markdown if any
                clean_text = raw_text.strip('\'" \n`')
                logger.info("Transcription result (%s): '%s'", model_candidate, clean_text)

                return {
                    "success": True,
                    "transcript": clean_text
                }
            except Exception as model_err:
                last_error = model_err
                logger.warning("Transcription attempt on %s failed: %s", model_candidate, model_err)

        if last_error:
            raise last_error

        return {"success": False, "transcript": ""}

    except Exception as e:
        logger.error("Audio transcription failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Audio transcription error: {str(e)}")
