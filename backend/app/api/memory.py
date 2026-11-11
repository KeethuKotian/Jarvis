from fastapi import APIRouter, HTTPException
from typing import Optional
from backend.app.schemas.memory import MemoryCreate, MemoryUpdate, MemoryListResponse, MemoryItem
from backend.app.services.memory_service import memory_service

router = APIRouter(prefix="/api/memory", tags=["Persistent Memory"])

@router.get("", response_model=MemoryListResponse)
def list_memories(active_only: bool = True):
    """Retrieves all transparent user memories from SQLite."""
    items = memory_service.get_memories(active_only=active_only)
    return MemoryListResponse(
        success=True,
        total=len(items),
        memories=[MemoryItem(**m) for m in items]
    )

@router.post("", response_model=MemoryItem)
def add_memory(request: MemoryCreate):
    """Adds a new explicit user-approved memory."""
    res = memory_service.add_memory(
        key=request.key,
        content=request.content,
        category=request.category
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to add memory."))
        
    all_mems = memory_service.get_memories(active_only=False)
    created = next((m for m in all_mems if m["id"] == res["id"]), None)
    if not created:
        raise HTTPException(status_code=500, detail="Failed to retrieve saved memory.")
    return MemoryItem(**created)

@router.put("/{memory_id}")
def update_memory(memory_id: int, request: MemoryUpdate):
    """Updates an existing memory item."""
    ok = memory_service.update_memory(
        memory_id=memory_id,
        content=request.content,
        category=request.category,
        is_active=request.is_active
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Memory not found or contains blocked sensitive secrets.")
    return {"success": True, "message": f"Memory {memory_id} updated."}

@router.delete("/{memory_id}")
def delete_memory(memory_id: int):
    """Deletes an individual memory."""
    ok = memory_service.delete_memory(memory_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Memory not found.")
    return {"success": True, "message": f"Memory {memory_id} deleted."}

@router.delete("")
def clear_all_memories():
    """Wipes all saved conversational memories upon user request."""
    memory_service.clear_all()
    return {"success": True, "message": "All memories cleared successfully."}

@router.post("/toggle")
def toggle_memory_system(enabled: bool):
    """Enables or disables the persistent memory feature."""
    memory_service.set_enabled(enabled)
    return {"success": True, "memory_enabled": memory_service.is_enabled()}
