import re
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from backend.app.database.session import get_db
from backend.app.utils.logger import logger

class ReminderService:
    @staticmethod
    def parse_natural_time(time_str: str) -> datetime:
        """Parses natural time expressions (e.g. 'tomorrow at 5pm', 'in 2 hours', 'at 10am', ISO string)."""
        now = datetime.now()
        s = time_str.lower().strip()
        
        # Try direct ISO parsing first
        try:
            return datetime.fromisoformat(time_str.replace("Z", "+00:00"))
        except ValueError:
            pass

        # "in X hours" / "in X minutes"
        in_match = re.search(r"in\s+(\d+)\s*(hour|minute|min|hr|day)s?", s)
        if in_match:
            amount = int(in_match.group(1))
            unit = in_match.group(2)
            if "min" in unit:
                return now + timedelta(minutes=amount)
            elif "hr" in unit or "hour" in unit:
                return now + timedelta(hours=amount)
            elif "day" in unit:
                return now + timedelta(days=amount)

        # "tomorrow"
        target_date = now.date()
        if "tomorrow" in s:
            target_date = target_date + timedelta(days=1)
            
        # Time extraction: "at 5pm", "at 10:30 am", "5 pm"
        time_match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)", s)
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2) or 0)
            meridiem = time_match.group(3)
            if meridiem == "pm" and hour != 12:
                hour += 12
            elif meridiem == "am" and hour == 12:
                hour = 0
            return datetime(target_date.year, target_date.month, target_date.day, hour, minute)

        # Default fallback: 1 hour from now
        return now + timedelta(hours=1)

    @classmethod
    def create_reminder(cls, title: str, scheduled_time_str: str) -> Dict[str, Any]:
        dt = cls.parse_natural_time(scheduled_time_str)
        scheduled_iso = dt.isoformat()
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO reminders (title, scheduled_time, status)
                VALUES (?, ?, 'PENDING')
            """, (title, scheduled_iso))
            reminder_id = cursor.lastrowid
            
        logger.info("Created reminder %d: '%s' at %s", reminder_id, title, scheduled_iso)
        return {
            "id": reminder_id,
            "title": title,
            "scheduled_time": scheduled_iso,
            "status": "PENDING"
        }

    @classmethod
    def get_reminders(cls, status: Optional[str] = None) -> List[Dict[str, Any]]:
        now_iso = datetime.now().isoformat()
        with get_db() as conn:
            cursor = conn.cursor()
            if status:
                cursor.execute("""
                    SELECT id, title, scheduled_time, status, created_at, completed_at
                    FROM reminders WHERE status = ? ORDER BY scheduled_time ASC
                """, (status,))
            else:
                cursor.execute("""
                    SELECT id, title, scheduled_time, status, created_at, completed_at
                    FROM reminders ORDER BY scheduled_time ASC
                """)
            rows = cursor.fetchall()

        results = []
        for r in rows:
            is_overdue = (r["status"] == "PENDING" and r["scheduled_time"] < now_iso)
            results.append({
                "id": r["id"],
                "title": r["title"],
                "scheduled_time": r["scheduled_time"],
                "status": r["status"],
                "created_at": r["created_at"],
                "completed_at": r["completed_at"],
                "is_overdue": is_overdue
            })
        return results

    @classmethod
    def mark_completed(cls, reminder_id: int) -> bool:
        now_iso = datetime.now().isoformat()
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE reminders
                SET status = 'COMPLETED', completed_at = ?
                WHERE id = ?
            """, (now_iso, reminder_id))
            return cursor.rowcount > 0

    @classmethod
    def delete_reminder(cls, reminder_id: int) -> bool:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
            return cursor.rowcount > 0

reminder_service = ReminderService()
