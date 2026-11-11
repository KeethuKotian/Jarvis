from fastapi import APIRouter, HTTPException
from typing import Optional
from backend.app.schemas.reminders import ReminderCreate, ReminderListResponse, ReminderItem
from backend.app.services.reminder_service import reminder_service

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])

@router.get("", response_model=ReminderListResponse)
def list_reminders(status: Optional[str] = None):
    """Retrieves all scheduled, completed, and overdue reminders from SQLite."""
    items = reminder_service.get_reminders(status=status)
    return ReminderListResponse(
        success=True,
        total=len(items),
        reminders=[ReminderItem(**i) for i in items]
    )

@router.post("", response_model=ReminderItem)
def create_reminder(request: ReminderCreate):
    """Creates a new scheduled reminder with natural language time support."""
    result = reminder_service.create_reminder(
        title=request.title,
        scheduled_time_str=request.scheduled_time
    )
    all_rems = reminder_service.get_reminders()
    created = next((r for r in all_rems if r["id"] == result["id"]), None)
    if not created:
        raise HTTPException(status_code=500, detail="Failed to save reminder.")
    return ReminderItem(**created)

@router.put("/{reminder_id}/complete")
def complete_reminder(reminder_id: int):
    """Marks a reminder as completed."""
    ok = reminder_service.mark_completed(reminder_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    return {"success": True, "message": f"Reminder {reminder_id} marked as completed."}

@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: int):
    """Deletes a reminder from persistent storage."""
    ok = reminder_service.delete_reminder(reminder_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    return {"success": True, "message": f"Reminder {reminder_id} deleted."}
