import os
from pathlib import Path
from typing import List, Dict
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash"
    APP_ENV: str = "development"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'jarvis.db'}"
    LOG_LEVEL: str = "INFO"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # ML & Intent settings
    CONFIDENCE_THRESHOLD: float = 0.65
    
    # Computer automation settings
    ALLOWED_DIRECTORIES: List[str] = [
        str(BASE_DIR.parent), # Jarvis project directory
        os.path.expanduser("~/Documents"),
        os.path.expanduser("~/Downloads"),
        os.path.expanduser("~/Desktop") if os.path.exists(os.path.expanduser("~/Desktop")) else str(BASE_DIR.parent),
        "D:\\" if os.path.exists("D:\\") else str(BASE_DIR.parent)
    ]
    
    ALLOWED_APPLICATIONS: Dict[str, str] = {
        "notepad": "notepad.exe",
        "calculator": "calc.exe",
        "calc": "calc.exe",
        "paint": "mspaint.exe",
        "mspaint": "mspaint.exe",
        "explorer": "explorer.exe",
        "file explorer": "explorer.exe",
        "cmd": "cmd.exe",
        "command prompt": "cmd.exe",
        "terminal": "wt.exe",
        "windows terminal": "wt.exe",
        "powershell": "powershell.exe",
        "taskmgr": "taskmgr.exe",
        "task manager": "taskmgr.exe",
        "edge": "msedge.exe",
        "microsoft edge": "msedge.exe",
        "wordpad": "write.exe",
        "chrome": r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "google chrome": r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "vscode": os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"),
        "vs code": os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"),
        "code": os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"),
        "visual studio code": os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"),
        "powerpoint": r"C:\Program Files\Microsoft Office\root\Office16\POWERPNT.EXE",
        "power point": r"C:\Program Files\Microsoft Office\root\Office16\POWERPNT.EXE",
        "ppt": r"C:\Program Files\Microsoft Office\root\Office16\POWERPNT.EXE",
        "word": r"C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE",
        "excel": r"C:\Program Files\Microsoft Office\root\Office16\EXCEL.EXE"
    }

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure data directory exists
os.makedirs(BASE_DIR / "data", exist_ok=True)
os.makedirs(BASE_DIR / "models", exist_ok=True)
