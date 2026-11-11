import os
import pytest
from pathlib import Path
from backend.app.tools.app_launcher import app_launcher
from backend.app.tools.file_search import file_searcher
from backend.app.tools.document_reader import document_reader
from backend.app.tools.system_control import system_control

def test_app_launcher_allowlist_blocking():
    # Attempting to launch malicious or unapproved executable
    result = app_launcher.execute(app_name="malicious_virus.exe")
    assert result["success"] is False
    assert "not in the approved" in result["error"]

def test_file_search_traversal_blocking():
    # Attempting to traverse outside allowed directories
    result = file_searcher.execute(query="test", directory="C:\\Windows\\System32")
    assert result["success"] is False
    assert "outside approved" in result["error"]

def test_file_search_within_workspace():
    # Searching for Buildthis.md in Jarvis root
    result = file_searcher.execute(query="Buildthis")
    assert result["success"] is True
    assert result["total_found"] >= 1
    found_names = [r["name"] for r in result["results"]]
    assert "Buildthis.md" in found_names

def test_document_reader_read_existing():
    target = Path(__file__).resolve().parent.parent.parent / "Buildthis.md"
    result = document_reader.execute(file_path=str(target), max_chars=500)
    assert result["success"] is True
    assert "MASTER PROMPT" in result["content"]
    assert result["char_count"] <= 500

def test_document_reader_nonexistent():
    result = document_reader.execute(file_path="d:/nonexistent_file_xyz.txt")
    assert result["success"] is False
    assert "does not exist" in result["error"]

def test_system_control_confirmation_required():
    # Lock action requires confirmation by default
    result = system_control.execute(action="lock", confirm=False)
    assert result["success"] is False
    assert result.get("requires_confirmation") is True

def test_system_control_get_stats():
    result = system_control.execute(action="get_stats")
    assert result["success"] is True
    assert "stats" in result
    assert "cpu_percent" in result["stats"]
    assert "ram_percent" in result["stats"]
