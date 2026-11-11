import pytest
from backend.app.services.reminder_service import reminder_service

def test_reminder_crud():
    # Create reminder
    rem = reminder_service.create_reminder("Test automated reminder", "in 2 hours")
    assert rem["id"] > 0
    assert rem["status"] == "PENDING"
    
    # List reminders
    all_rems = reminder_service.get_reminders()
    ids = [r["id"] for r in all_rems]
    assert rem["id"] in ids
    
    # Mark completed
    ok = reminder_service.mark_completed(rem["id"])
    assert ok is True
    
    # Verify completed
    updated_rems = reminder_service.get_reminders()
    target = next(r for r in updated_rems if r["id"] == rem["id"])
    assert target["status"] == "COMPLETED"
    
    # Delete reminder
    del_ok = reminder_service.delete_reminder(rem["id"])
    assert del_ok is True
