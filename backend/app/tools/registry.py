from typing import Dict, Any, Optional, List
from backend.app.tools.base import BaseTool
from backend.app.tools.app_launcher import app_launcher
from backend.app.tools.file_search import file_searcher
from backend.app.tools.document_reader import document_reader
from backend.app.tools.system_control import system_control
from backend.app.tools.web_search import web_searcher
from backend.app.utils.logger import logger

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {
            "open_application": app_launcher,
            "search_files": file_searcher,
            "read_document": document_reader,
            "system_control": system_control,
            "web_search": web_searcher,
        }

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {"name": name, "description": tool.description}
            for name, tool in self._tools.items()
        ]

    def execute_tool(self, name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        tool = self.get_tool(name)
        if not tool:
            return {
                "success": False,
                "error": f"Tool '{name}' is not recognized in tool registry."
            }
        return tool.execute(**params)

tool_registry = ToolRegistry()
