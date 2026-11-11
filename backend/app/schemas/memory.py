from pydantic import BaseModel, Field
from typing import Optional, List

class MemoryCreate(BaseModel):
    key: str = Field(..., description="Short key/identifier, e.g. user_name, preferred_ide")
    content: str = Field(..., description="Content of the memory to remember")
    category: str = Field("user_preference", description="Category: user_preference, work, personal, context")

class MemoryUpdate(BaseModel):
    content: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

class MemoryItem(BaseModel):
    id: int
    category: str
    key: str
    content: str
    is_active: bool
    created_at: str
    updated_at: str

class MemoryListResponse(BaseModel):
    success: bool
    total: int
    memories: List[MemoryItem]
