import os
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure test DB or test environment
os.environ["APP_ENV"] = "testing"

from backend.app.main import app
from backend.app.database.session import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
