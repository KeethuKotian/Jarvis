from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

class AppLaunchRequest(BaseModel):
    app_name: str = Field(..., description="Name of the application to launch")

class AppLaunchResponse(BaseModel):
    success: bool
    app_name: str
    message: str
    pid: Optional[int] = None

class FileSearchRequest(BaseModel):
    query: str = Field(..., description="Filename or keyword to search for")
    file_type: Optional[str] = Field(None, description="Extension filter like .pdf, .txt, .docx")
    directory: Optional[str] = Field(None, description="Optional root search directory within allowed paths")
    max_results: int = Field(20, ge=1, le=100)

class FileSearchResultItem(BaseModel):
    name: str
    path: str
    size_bytes: int
    modified_time: str
    extension: str

class FileSearchResponse(BaseModel):
    success: bool
    query: str
    total_found: int
    results: List[FileSearchResultItem]
    message: str

class DocumentReadRequest(BaseModel):
    file_path: str = Field(..., description="Path of document to read")
    max_chars: int = Field(5000, ge=100, le=50000)

class DocumentReadResponse(BaseModel):
    success: bool
    file_path: str
    file_type: str
    content: str
    char_count: int
    truncated: bool
    error: Optional[str] = None

class SystemControlRequest(BaseModel):
    action: str = Field(..., description="Action: 'lock', 'mute', 'unmute', 'get_stats'")
    confirm: bool = Field(False, description="Explicit confirmation flag for consequential actions")

class SystemControlResponse(BaseModel):
    success: bool
    action: str
    message: str
    stats: Optional[Dict[str, Any]] = None

class WebSearchRequest(BaseModel):
    query: str = Field(..., description="Query to search on the web")
    max_results: int = Field(5, ge=1, le=10)

class WebSearchResultItem(BaseModel):
    title: str
    link: str
    snippet: str

class WebSearchResponse(BaseModel):
    success: bool
    query: str
    results: List[WebSearchResultItem]
    message: str
