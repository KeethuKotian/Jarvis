import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from backend.app.database.session import get_db
from backend.app.utils.logger import logger

SECRET_PATTERNS = [
    re.compile(r"(password|passwd|secret|token|api_key|bearer|credentials)\s*[:=]\s*\S+", re.IGNORECASE),
    re.compile(r"AQ\.[A-Za-z0-9_\-]{20,}"),
    re.compile(r"AIza[0-9A-Za-z-_]{35}")
]

class MemoryService:
    _memory_enabled: bool = True

    @classmethod
    def is_enabled(cls) -> bool:
        return cls._memory_enabled

    @classmethod
    def set_enabled(cls, enabled: bool):
        cls._memory_enabled = enabled
        logger.info("Memory system enabled status changed to: %s", enabled)

    @classmethod
    def contains_sensitive_secrets(cls, text: str) -> bool:
        """Checks if text appears to contain passwords, keys, or credentials."""
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                return True
        return False

    @classmethod
    def add_memory(cls, key: str, content: str, category: str = "user_preference") -> Dict[str, Any]:
        if not cls._memory_enabled:
            return {"success": False, "error": "Memory system is currently disabled by user."}

        if cls.contains_sensitive_secrets(content) or cls.contains_sensitive_secrets(key):
            logger.warning("Attempted storage of sensitive secret in memory blocked.")
            return {
                "success": False,
                "error": "Security policy violation: Secrets, API keys, and passwords cannot be stored in memory."
            }

        now_iso = datetime.now().isoformat()
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO memories (category, key, content, is_active, created_at, updated_at)
                VALUES (?, ?, ?, 1, ?, ?)
            """, (category, key.strip(), content.strip(), now_iso, now_iso))
            mem_id = cursor.lastrowid

        logger.info("Added memory %d [%s]: %s", mem_id, key, content)
        return {
            "success": True,
            "id": mem_id,
            "category": category,
            "key": key,
            "content": content
        }

    @classmethod
    def get_memories(cls, active_only: bool = True) -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            if active_only:
                cursor.execute("""
                    SELECT id, category, key, content, is_active, created_at, updated_at
                    FROM memories WHERE is_active = 1 ORDER BY updated_at DESC
                """)
            else:
                cursor.execute("""
                    SELECT id, category, key, content, is_active, created_at, updated_at
                    FROM memories ORDER BY updated_at DESC
                """)
            rows = cursor.fetchall()

        return [
            {
                "id": r["id"],
                "category": r["category"],
                "key": r["key"],
                "content": r["content"],
                "is_active": bool(r["is_active"]),
                "created_at": r["created_at"],
                "updated_at": r["updated_at"]
            }
            for r in rows
        ]

    @classmethod
    def update_memory(cls, memory_id: int, content: Optional[str] = None, category: Optional[str] = None, is_active: Optional[bool] = None) -> bool:
        if content and cls.contains_sensitive_secrets(content):
            return False

        now_iso = datetime.now().isoformat()
        with get_db() as conn:
            cursor = conn.cursor()
            updates = ["updated_at = ?"]
            params = [now_iso]
            if content is not None:
                updates.append("content = ?")
                params.append(content.strip())
            if category is not None:
                updates.append("category = ?")
                params.append(category.strip())
            if is_active is not None:
                updates.append("is_active = ?")
                params.append(1 if is_active else 0)
            params.append(memory_id)

            cursor.execute(f"UPDATE memories SET {', '.join(updates)} WHERE id = ?", params)
            return cursor.rowcount > 0

    @classmethod
    def delete_memory(cls, memory_id: int) -> bool:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
            return cursor.rowcount > 0

    @classmethod
    def clear_all(cls) -> bool:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM memories")
            logger.info("All memories cleared by user.")
            return True

    @classmethod
    def get_context_for_prompt(cls) -> str:
        """Returns active memory summaries formatted for context injection."""
        if not cls._memory_enabled:
            return ""
        mems = cls.get_memories(active_only=True)
        if not mems:
            return ""
        lines = [f"- {m['key']}: {m['content']}" for m in mems[:10]]
        return "Relevant User Memories and Preferences:\n" + "\n".join(lines)

memory_service = MemoryService()
