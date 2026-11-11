from pydantic import BaseModel, Field
from typing import Optional, List

class ReminderCreate(BaseModel):
    title: str = Field(..., description="Reminder description/text")
    scheduled_time: str = Field(..., description="ISO datetime string or natural time")

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    scheduled_time: Optional[str] = None
    status: Optional[str] = None

class ReminderItem(BaseModel):
    id: int
    title: str
    scheduled_time: str
    status: str
    created_at: str
    completed_at: Optional[str] = None
    is_overdue: bool = False

class ReminderListResponse(BaseModel):
    success: bool
    total: int
    reminders: List[ReminderItem]
