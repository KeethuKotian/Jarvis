import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional, List
from backend.app.tools.base import BaseTool
from backend.app.config import settings, BASE_DIR
from backend.app.utils.logger import logger

SAFE_DOCUMENT_EXTENSIONS = {
    '.pptx', '.ppt', '.docx', '.doc', '.xlsx', '.xls',
    '.pdf', '.txt', '.csv', '.png', '.jpg', '.jpeg',
    '.mp4', '.mp3', '.md'
}

COMMON_FALLBACKS: Dict[str, List[str]] = {
    "chrome": [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe")
    ],
    "google chrome": [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe")
    ],
    "vs code": [
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"),
        r"C:\Program Files\Microsoft VS Code\Code.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.cmd")
    ],
    "vscode": [
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"),
        r"C:\Program Files\Microsoft VS Code\Code.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.cmd")
    ],
    "code": [
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"),
        r"C:\Program Files\Microsoft VS Code\Code.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.cmd")
    ]
}

class AppLauncherTool(BaseTool):
    name = "open_application"
    description = "Launches approved Windows applications (e.g. chrome, vs code, notepad, calculator, paint, explorer, cmd, edge, task manager)."

    def _resolve_executable(self, normalized_name: str) -> Optional[str]:
        # 1. Direct match in allowed applications
        for key, exe in settings.ALLOWED_APPLICATIONS.items():
            if key == normalized_name or key in normalized_name or normalized_name in key:
                if os.path.isabs(exe) and os.path.exists(exe):
                    return exe
                which_path = shutil.which(exe)
                if which_path:
                    return which_path
                # Check common fallbacks
                if key in COMMON_FALLBACKS:
                    for fb in COMMON_FALLBACKS[key]:
                        if os.path.exists(fb):
                            return fb
                return exe # Return default name if in PATH

        # 2. Check common fallbacks directly
        for key, paths in COMMON_FALLBACKS.items():
            if key in normalized_name or normalized_name in key:
                for p in paths:
                    if os.path.exists(p):
                        return p

        return None

    def _resolve_document_file(self, target: str) -> Optional[str]:
        """Resolves target to an existing document or presentation file."""
        if not target:
            return None
        cleaned = target.strip(' "\'<>')
        
        # 1. Direct path check
        if os.path.isabs(cleaned) and os.path.exists(cleaned):
            ext = Path(cleaned).suffix.lower()
            if ext in SAFE_DOCUMENT_EXTENSIONS:
                return cleaned

        # 2. Normalize spoken extensions (e.g. "techmania pptx" -> "techmania.pptx")
        base_name = cleaned
        base_name = re.sub(r'\s+pptx\b', '.pptx', base_name, flags=re.I)
        base_name = re.sub(r'\s+pdf\b', '.pdf', base_name, flags=re.I)
        base_name = re.sub(r'\s+docx\b', '.docx', base_name, flags=re.I)
        base_name = re.sub(r'\s+txt\b', '.txt', base_name, flags=re.I)
        base_name = re.sub(r'\s+xlsx\b', '.xlsx', base_name, flags=re.I)

        # Remove filler words from target
        for filler in [
            "open the ", "open ", "launch the ", "launch ", "start the ", "start ",
            "run the ", "run ", "show me the ", "show me ", "the ",
            "in my d drive", "on my d drive", "in d drive", "on d drive",
            "in my c drive", "on my c drive", "in c drive", "on c drive",
            "file ", "presentation ", "document ", "slides "
        ]:
            base_name = re.sub(re.escape(filler), '', base_name, flags=re.I).strip()

        # Check direct path again after filler removal
        if os.path.isabs(base_name) and os.path.exists(base_name):
            return base_name

        search_dirs = [
            "D:\\",
            str(BASE_DIR.parent),
            os.path.expanduser("~/Documents"),
            os.path.expanduser("~/Downloads"),
            os.path.expanduser("~/Desktop")
        ]

        # Scan search directories
        for d in search_dirs:
            if not os.path.exists(d):
                continue
            # Direct match
            candidate = os.path.join(d, base_name)
            if os.path.exists(candidate) and os.path.isfile(candidate):
                return candidate
            # Match with extension
            for ext in SAFE_DOCUMENT_EXTENSIONS:
                candidate = os.path.join(d, f"{base_name}{ext}")
                if os.path.exists(candidate) and os.path.isfile(candidate):
                    return candidate
                candidate = os.path.join(d, f"{base_name.replace(' ', '')}{ext}")
                if os.path.exists(candidate) and os.path.isfile(candidate):
                    return candidate

        return None

    def run(self, app_name: str = "", file_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        target_input = file_path or app_name
        
        # 1. Check if the target is a document/presentation file
        doc_file = self._resolve_document_file(target_input)
        if doc_file:
            try:
                ext = Path(doc_file).suffix.lower()
                launched = False
                
                # Direct Office app launching for high reliability
                if ext in ['.pptx', '.ppt']:
                    ppt_exe = r"C:\Program Files\Microsoft Office\root\Office16\POWERPNT.EXE"
                    if os.path.exists(ppt_exe):
                        subprocess.Popen([ppt_exe, doc_file], shell=False)
                        launched = True
                elif ext in ['.docx', '.doc']:
                    word_exe = r"C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE"
                    if os.path.exists(word_exe):
                        subprocess.Popen([word_exe, doc_file], shell=False)
                        launched = True
                elif ext in ['.xlsx', '.xls', '.csv']:
                    excel_exe = r"C:\Program Files\Microsoft Office\root\Office16\EXCEL.EXE"
                    if os.path.exists(excel_exe):
                        subprocess.Popen([excel_exe, doc_file], shell=False)
                        launched = True

                if not launched:
                    try:
                        os.startfile(doc_file)
                    except Exception:
                        subprocess.Popen(f'start "" "{doc_file}"', shell=True)

                file_name = Path(doc_file).name
                logger.info("Successfully opened document/presentation: %s", doc_file)
                return {
                    "success": True,
                    "app_name": file_name,
                    "executable": doc_file,
                    "is_document": True,
                    "message": f"Successfully launched '{file_name}' from {doc_file}."
                }
            except Exception as doc_err:
                logger.error("Failed to open document %s: %s", doc_file, doc_err)
                return {
                    "success": False,
                    "app_name": target_input,
                    "error": f"Failed to open document: {str(doc_err)}"
                }

        normalized = app_name.lower().strip()
        
        # Clean extra phrases like "app", "application", "browser", "editor"
        cleaned_target = normalized
        for word in ["app", "application", "browser", "editor", "ide", "the", "program"]:
            cleaned_target = cleaned_target.replace(word, "").strip()
        
        target_executable = self._resolve_executable(cleaned_target) or self._resolve_executable(normalized)
        
        if not target_executable:
            allowed_list = ", ".join(sorted(set(settings.ALLOWED_APPLICATIONS.keys())))
            return {
                "success": False,
                "app_name": app_name,
                "error": f"Application '{app_name}' is not in the approved application allowlist.",
                "allowed_applications": allowed_list
            }

        try:
            logger.info("Launching approved application: %s -> %s", app_name, target_executable)
            
            # If executable is full path and exists
            if os.path.isabs(target_executable) and os.path.exists(target_executable):
                try:
                    os.startfile(target_executable)
                    return {
                        "success": True,
                        "app_name": app_name,
                        "executable": target_executable,
                        "message": f"Successfully launched {app_name}."
                    }
                except Exception:
                    pass

            # Fallback to subprocess Popen without shell
            proc = subprocess.Popen([target_executable], shell=False)
            return {
                "success": True,
                "app_name": app_name,
                "executable": target_executable,
                "pid": proc.pid,
                "message": f"Successfully launched {app_name} (Process ID: {proc.pid})."
            }
        except Exception as e:
            # Try Windows os.startfile as final safe launcher
            try:
                os.startfile(target_executable)
                return {
                    "success": True,
                    "app_name": app_name,
                    "executable": target_executable,
                    "message": f"Successfully launched {app_name}."
                }
            except Exception as start_err:
                logger.error("Failed to launch application %s: %s", app_name, start_err)
                return {
                    "success": False,
                    "app_name": app_name,
                    "error": f"System error launching application: {str(start_err)}"
                }

app_launcher = AppLauncherTool()
