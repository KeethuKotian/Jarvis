import os
from pathlib import Path
from typing import Dict, Any, Optional
from pypdf import PdfReader
from docx import Document
from backend.app.tools.base import BaseTool
from backend.app.config import settings
from backend.app.utils.logger import logger

class DocumentReaderTool(BaseTool):
    name = "read_document"
    description = "Safely reads and extracts text content from TXT, MD, PDF, and DOCX documents within approved directories."

    def _is_path_allowed(self, target_path: Path) -> bool:
        target_resolved = target_path.resolve()
        for allowed in settings.ALLOWED_DIRECTORIES:
            allowed_resolved = Path(allowed).resolve()
            try:
                if os.path.commonpath([target_resolved, allowed_resolved]) == str(allowed_resolved):
                    return True
            except ValueError:
                continue
        return False

    def run(self, file_path: str, max_chars: int = 5000, **kwargs) -> Dict[str, Any]:
        path = Path(file_path).resolve()
        
        if not path.exists():
            return {
                "success": False,
                "file_path": file_path,
                "error": f"File does not exist: {file_path}"
            }
            
        if not path.is_file():
            return {
                "success": False,
                "file_path": file_path,
                "error": f"Target path is not a file: {file_path}"
            }
            
        if not self._is_path_allowed(path):
            return {
                "success": False,
                "file_path": file_path,
                "error": "Access denied. Target file is outside user-approved directories."
            }

        # Check file size (refuse files > 25MB to prevent memory exhaustion)
        try:
            size = path.stat().st_size
            if size > 25 * 1024 * 1024:
                return {
                    "success": False,
                    "file_path": file_path,
                    "error": f"File is too large ({size / (1024*1024):.1f} MB). Maximum supported size is 25 MB."
                }
        except Exception as e:
            return {"success": False, "file_path": file_path, "error": str(e)}

        ext = path.suffix.lower()
        extracted_text = ""
        truncated = False

        try:
            if ext in [".txt", ".md", ".json", ".csv", ".log", ".py", ".html"]:
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    extracted_text = f.read(max_chars + 1)
            elif ext == ".pdf":
                reader = PdfReader(str(path))
                if reader.is_encrypted:
                    return {
                        "success": False,
                        "file_path": file_path,
                        "error": "PDF file is encrypted or password-protected."
                    }
                chunks = []
                for page in reader.pages:
                    text = page.extract_text() or ""
                    chunks.append(text)
                    if sum(len(c) for c in chunks) >= max_chars:
                        break
                extracted_text = "\n".join(chunks)
            elif ext == ".docx":
                doc = Document(str(path))
                paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                extracted_text = "\n".join(paragraphs)
            else:
                return {
                    "success": False,
                    "file_path": file_path,
                    "error": f"Unsupported document format '{ext}'. Supported formats: .txt, .md, .json, .csv, .pdf, .docx."
                }
        except Exception as e:
            logger.error("Error reading document %s: %s", file_path, e)
            return {
                "success": False,
                "file_path": file_path,
                "error": f"Error parsing document: {str(e)}"
            }

        if len(extracted_text) > max_chars:
            extracted_text = extracted_text[:max_chars]
            truncated = True

        return {
            "success": True,
            "file_path": str(path),
            "file_type": ext,
            "content": extracted_text,
            "char_count": len(extracted_text),
            "truncated": truncated,
            "message": f"Successfully read {len(extracted_text)} characters from {path.name}."
        }

document_reader = DocumentReaderTool()
