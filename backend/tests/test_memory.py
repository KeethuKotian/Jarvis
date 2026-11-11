import pytest
from backend.app.services.memory_service import memory_service

def test_memory_crud_and_safety():
    # Attempting to store secret should be rejected
    bad_res = memory_service.add_memory("secret_key", "password: super_secret_123")
    assert bad_res["success"] is False
    assert "Security policy violation" in bad_res["error"]

    # Safe memory addition
    good_res = memory_service.add_memory("user_preferred_theme", "deep midnight cyan HUD")
    assert good_res["success"] is True
    mem_id = good_res["id"]

    # Verify retrieval
    mems = memory_service.get_memories()
    keys = [m["key"] for m in mems]
    assert "user_preferred_theme" in keys

    # Verify context injection prompt formatting
    ctx = memory_service.get_context_for_prompt()
    assert "user_preferred_theme" in ctx

    # Clean up
    del_ok = memory_service.delete_memory(mem_id)
    assert del_ok is True
