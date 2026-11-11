from typing import Dict, Any, List
from duckduckgo_search import DDGS
from backend.app.tools.base import BaseTool
from backend.app.utils.logger import logger

class WebSearchTool(BaseTool):
    name = "web_search"
    description = "Searches the live web using DuckDuckGo to provide current news, facts, and online documentation."

    def run(self, query: str, max_results: int = 5, **kwargs) -> Dict[str, Any]:
        clean_query = query.strip()
        if not clean_query:
            return {
                "success": False,
                "query": query,
                "error": "Search query cannot be empty."
            }

        try:
            logger.info("Executing web search for query: '%s'", clean_query)
            results: List[Dict[str, str]] = []
            
            with DDGS() as ddgs:
                ddg_results = list(ddgs.text(clean_query, max_results=max_results))
                for r in ddg_results:
                    results.append({
                        "title": r.get("title", "No Title"),
                        "link": r.get("href", ""),
                        "snippet": r.get("body", "")
                    })

            return {
                "success": True,
                "query": clean_query,
                "total_found": len(results),
                "results": results,
                "message": f"Retrieved {len(results)} search results for '{clean_query}'."
            }
        except Exception as e:
            logger.warning("Web search provider error: %s", e)
            return {
                "success": False,
                "query": clean_query,
                "error": f"Web search provider temporarily unavailable: {str(e)}",
                "results": []
            }

web_searcher = WebSearchTool()
