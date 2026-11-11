import io
import wave
import pytest
from backend.app.services.whisper_service import whisper_service

def test_whisper_service_initialization():
    assert whisper_service.is_loaded is True
    assert whisper_service.model is not None
    assert "small.en" in whisper_service.model_size or "base.en" in whisper_service.model_size

def test_whisper_service_transcribe_audio():
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(b'\x00\x00' * 8000)
    buf.seek(0)
    res = whisper_service.transcribe(buf.getvalue(), mime_type="audio/wav")
    assert res["success"] is True
    assert "latency_ms" in res

