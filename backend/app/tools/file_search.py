import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.app.tools.base import BaseTool
from backend.app.config import settings
from backend.app.utils.logger import logger

EXCLUDED_DIRS = {
    ".git", "__pycache__", "node_modules", "venv", ".venv",
    "$Recycle.Bin", "System Volume Information", "Windows", "Program Files", "AppData"
}

class FileSearchTool(BaseTool):
    name = "search_files"
    description = "Searches for files within user-approved directories by name and extension filter."

    def _is_path_allowed(self, target_path: Path) -> bool:
        """Enforces that target directory is strictly within allowed directories."""
        target_resolved = target_path.resolve()
        for allowed in settings.ALLOWED_DIRECTORIES:
            allowed_resolved = Path(allowed).resolve()
            try:
                # commonpath must equal allowed_resolved
                if os.path.commonpath([target_resolved, allowed_resolved]) == str(allowed_resolved):
                    return True
            except ValueError:
                # Different drives on Windows
                continue
        return False

    def run(self, query: str, file_type: Optional[str] = None, directory: Optional[str] = None, max_results: int = 20, **kwargs) -> Dict[str, Any]:
        results: List[Dict[str, Any]] = []
        search_dirs: List[Path] = []
        
        if directory:
            cand = Path(directory)
            if not self._is_path_allowed(cand):
                return {
                    "success": False,
                    "query": query,
                    "error": f"Directory '{directory}' is outside approved search directories.",
                    "results": []
                }
            search_dirs = [cand]
        else:
            search_dirs = [Path(d) for d in settings.ALLOWED_DIRECTORIES if os.path.exists(d)]

        normalized_query = query.lower().strip()
        filter_ext = file_type.lower().strip() if file_type else None
        if filter_ext and not filter_ext.startswith("."):
            filter_ext = f".{filter_ext}"

        total_scanned = 0
        for root_dir in search_dirs:
            if len(results) >= max_results:
                break
            try:
                for root, dirs, files in os.walk(root_dir, topdown=True):
                    # Exclude sensitive or noisy directories in-place
                    dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS and not d.startswith(".")]
                    
                    for f in files:
                        total_scanned += 1
                        if total_scanned > 10000:
                            break # Guard against runaway recursion
                            
                        # Check extension
                        ext = os.path.splitext(f)[1].lower()
                        if filter_ext and ext != filter_ext:
                            continue
                            
                        # Check query substring
                        if normalized_query and (normalized_query not in f.lower()):
                            continue
                            
                        full_path = Path(root) / f
                        try:
                            st = full_path.stat()
                            results.append({
                                "name": f,
                                "path": str(full_path),
                                "size_bytes": st.st_size,
                                "modified_time": datetime.fromtimestamp(st.st_mtime).isoformat(),
                                "extension": ext
                            })
                        except (PermissionError, OSError):
                            continue
                            
                        if len(results) >= max_results:
                            break
                    if len(results) >= max_results:
                        break
            except Exception as e:
                logger.warning("Error traversing %s: %s", root_dir, e)
                
        return {
            "success": True,
            "query": query,
            "total_found": len(results),
            "results": results,
            "message": f"Found {len(results)} matching files." if results else "No matching files found in permitted directories."
        }

file_searcher = FileSearchTool()
