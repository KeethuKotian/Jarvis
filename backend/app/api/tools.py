from fastapi import APIRouter, HTTPException
from backend.app.schemas.tools import (
    AppLaunchRequest, AppLaunchResponse,
    FileSearchRequest, FileSearchResponse,
    DocumentReadRequest, DocumentReadResponse,
    SystemControlRequest, SystemControlResponse,
    WebSearchRequest, WebSearchResponse
)
from backend.app.tools.registry import tool_registry
from backend.app.config import settings

router = APIRouter(prefix="/api/tools", tags=["Computer Tools"])

@router.get("/list")
def list_available_tools():
    """Returns all registered computer tools and their capability schemas."""
    return {"tools": tool_registry.list_tools()}

@router.get("/allowed-apps")
def get_allowed_applications():
    """Returns the explicit allowlist of launchable applications."""
    return {"allowed_applications": sorted(list(settings.ALLOWED_APPLICATIONS.keys()))}

@router.post("/launch-app", response_model=AppLaunchResponse)
def launch_application(request: AppLaunchRequest):
    """Launches an approved application from the allowlist."""
    result = tool_registry.execute_tool("open_application", {"app_name": request.app_name})
    if not result.get("success"):
        raise HTTPException(status_code=403, detail=result.get("error", "Application launch not permitted."))
    return AppLaunchResponse(
        success=True,
        app_name=result.get("app_name", request.app_name),
        message=result.get("message", "Application launched successfully."),
        pid=result.get("pid")
    )

@router.post("/search-files", response_model=FileSearchResponse)
def search_files(request: FileSearchRequest):
    """Searches within user-permitted directories."""
    result = tool_registry.execute_tool("search_files", {
        "query": request.query,
        "file_type": request.file_type,
        "directory": request.directory,
        "max_results": request.max_results
    })
    return FileSearchResponse(
        success=result.get("success", False),
        query=request.query,
        total_found=result.get("total_found", 0),
        results=result.get("results", []),
        message=result.get("message", "")
    )

@router.post("/read-document", response_model=DocumentReadResponse)
def read_document(request: DocumentReadRequest):
    """Safely extracts text content from allowed documents."""
    result = tool_registry.execute_tool("read_document", {
        "file_path": request.file_path,
        "max_chars": request.max_chars
    })
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to read document."))
    return DocumentReadResponse(
        success=True,
        file_path=result.get("file_path", request.file_path),
        file_type=result.get("file_type", ""),
        content=result.get("content", ""),
        char_count=result.get("char_count", 0),
        truncated=result.get("truncated", False)
    )

@router.post("/system-control", response_model=SystemControlResponse)
def control_system(request: SystemControlRequest):
    """Executes safe low-risk Windows system operations."""
    result = tool_registry.execute_tool("system_control", {
        "action": request.action,
        "confirm": request.confirm
    })
    if not result.get("success") and not result.get("requires_confirmation"):
        raise HTTPException(status_code=400, detail=result.get("error", "System control error."))
    return SystemControlResponse(
        success=result.get("success", False),
        action=request.action,
        message=result.get("message", ""),
        stats=result.get("stats")
    )

@router.post("/web-search", response_model=WebSearchResponse)
def perform_web_search(request: WebSearchRequest):
    """Searches live DuckDuckGo results."""
    result = tool_registry.execute_tool("web_search", {
        "query": request.query,
        "max_results": request.max_results
    })
    return WebSearchResponse(
        success=result.get("success", False),
        query=request.query,
        results=result.get("results", []),
        message=result.get("message", "")
    )
