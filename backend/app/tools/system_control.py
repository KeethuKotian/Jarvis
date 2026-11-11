import ctypes
import os
import psutil
from typing import Dict, Any, Optional
from backend.app.tools.base import BaseTool
from backend.app.utils.logger import logger

class SystemControlTool(BaseTool):
    name = "system_control"
    description = "Performs safe, approved low-risk Windows operations: workstation lock, audio mute/unmute, and system resource telemetry."

    ALLOWED_ACTIONS = {"lock", "mute", "unmute", "get_stats"}
    CONSEQUENTIAL_ACTIONS = {"lock"}

    def run(self, action: str, confirm: bool = False, **kwargs) -> Dict[str, Any]:
        norm_action = action.lower().strip()
        
        if norm_action not in self.ALLOWED_ACTIONS:
            return {
                "success": False,
                "action": action,
                "error": f"Action '{action}' is not in approved system control actions: {', '.join(sorted(self.ALLOWED_ACTIONS))}."
            }

        # Consequential action confirmation check
        if norm_action in self.CONSEQUENTIAL_ACTIONS and not confirm:
            return {
                "success": False,
                "requires_confirmation": True,
                "action": norm_action,
                "message": f"Action '{norm_action}' requires explicit confirmation. Please confirm to proceed."
            }

        if norm_action == "lock":
            try:
                # Standard Windows User32 LockWorkStation API
                result = ctypes.windll.user32.LockWorkStation()
                return {
                    "success": bool(result),
                    "action": "lock",
                    "message": "Workstation locked successfully."
                }
            except Exception as e:
                logger.error("Error locking workstation: %s", e)
                return {"success": False, "action": "lock", "error": str(e)}

        elif norm_action in ("mute", "unmute"):
            try:
                # Windows virtual key for volume mute toggle: VK_VOLUME_MUTE = 0xAD
                VK_VOLUME_MUTE = 0xAD
                ctypes.windll.user32.keybd_event(VK_VOLUME_MUTE, 0, 0, 0)
                ctypes.windll.user32.keybd_event(VK_VOLUME_MUTE, 0, 2, 0) # Key up
                return {
                    "success": True,
                    "action": norm_action,
                    "message": f"System audio {norm_action} toggled successfully."
                }
            except Exception as e:
                return {"success": False, "action": norm_action, "error": str(e)}

        elif norm_action == "get_stats":
            try:
                cpu_percent = psutil.cpu_percent(interval=0.1)
                mem = psutil.virtual_memory()
                battery = psutil.sensors_battery()
                disk = psutil.disk_usage("C:\\")
                
                stats = {
                    "cpu_percent": cpu_percent,
                    "ram_percent": mem.percent,
                    "ram_used_gb": round(mem.used / (1024**3), 2),
                    "ram_total_gb": round(mem.total / (1024**3), 2),
                    "battery_percent": round(battery.percent, 1) if battery else None,
                    "power_plugged": battery.power_plugged if battery else None,
                    "disk_free_gb": round(disk.free / (1024**3), 2),
                    "disk_total_gb": round(disk.total / (1024**3), 2),
                    "process_count": len(psutil.pids())
                }
                return {
                    "success": True,
                    "action": "get_stats",
                    "stats": stats,
                    "message": f"CPU: {cpu_percent}%, RAM: {mem.percent}%, Battery: {stats['battery_percent']}%"
                }
            except Exception as e:
                return {"success": False, "action": "get_stats", "error": str(e)}

        return {"success": False, "action": action, "error": "Unknown execution branch."}

system_control = SystemControlTool()
