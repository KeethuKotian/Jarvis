import time
import re
from typing import Dict, Any, Optional, Tuple

from backend.app.ml.predictor import predictor
from backend.app.ml.preprocessor import normalize_text
from backend.app.services.gemini_service import gemini_service
from backend.app.services.reminder_service import reminder_service
from backend.app.tools.registry import tool_registry
from backend.app.database.session import get_db
from backend.app.schemas.chat import ChatResponse, DiagnosticsData
from backend.app.utils.logger import logger

class HybridRouter:
    """Core routing engine orchestrating the Custom ML Classifier, Local Computer Tools, and Gemini API."""

    def _extract_app_name(self, text: str) -> str:
        clean = normalize_text(text)
        # Check known apps first
        for app_alias in [
            "google chrome", "chrome", "visual studio code", "vs code", "vscode", "code",
            "notepad", "calculator", "calc", "paint", "mspaint", "file explorer", "explorer",
            "command prompt", "cmd", "windows terminal", "terminal", "powershell",
            "task manager", "taskmgr", "microsoft edge", "edge", "wordpad", "spotify", "discord"
        ]:
            if app_alias in clean:
                return app_alias
                
        # Fallback to regex extraction
        match = re.search(r'\b(?:open|launch|start|run|bring up|fire up|pull up)\s+(?:the\s+)?([a-z0-9_\-\s]+?)(?:\s+(?:app|application|for me|please))?$', clean)
        if match:
            return match.group(1).strip()
            
        for prefix in ["open", "launch", "start", "run", "bring up", "fire up", "pull up"]:
            if clean.startswith(prefix):
                target = clean[len(prefix):].strip()
                for filler in ["the", "app", "application", "for me", "please"]:
                    target = re.sub(r'\b' + filler + r'\b', '', target).strip()
                return target
        return clean

    def _extract_file_query(self, text: str) -> Tuple[str, Optional[str]]:
        clean = normalize_text(text)
        # Check for extension
        ext_match = re.search(r'\b(pdf|txt|docx|doc|json|py|csv|xlsx|pptx)\b', clean)
        ext = f".{ext_match.group(1)}" if ext_match else None
        
        # Remove search triggers
        query = clean
        for prefix in ["search for", "find all", "find files", "find my", "find document", "find", "search", "locate", "look for", "where is"]:
            if query.startswith(prefix):
                query = query[len(prefix):].strip()
                break
        for filler in ["files in documents", "in downloads", "on my computer", "on desktop", "documents", "files"]:
            query = re.sub(r'\b' + filler + r'\b', '', query).strip()
        return query or "document", ext

    def _extract_reminder_parts(self, text: str) -> Tuple[str, str]:
        clean = text.strip()
        # Find time markers
        time_split = re.split(r'\b(at|on|tomorrow|in|by)\b', clean, maxsplit=1, flags=re.IGNORECASE)
        if len(time_split) >= 3:
            title_part = time_split[0]
            time_part = time_split[1] + " " + time_split[2]
        else:
            title_part = clean
            time_part = "in 1 hour"

        # Clean title
        title = title_part
        for prefix in ["remind me to", "remind me", "set a reminder to", "set reminder to", "create a reminder for", "add a reminder to"]:
            if title.lower().startswith(prefix):
                title = title[len(prefix):].strip()
                break
        return title or "Reminder", time_part

    def _extract_document_open_target(self, text: str) -> Optional[str]:
        clean = normalize_text(text)
        open_prefixes = [
            "open the ", "open ", "launch the ", "launch ", "start the ", "start ",
            "show me the ", "show me ", "run the ", "run "
        ]
        matched = False
        target = clean
        for prefix in open_prefixes:
            if clean.startswith(prefix):
                target = clean[len(prefix):].strip()
                matched = True
                break

        if not matched and ("open" in clean or "launch" in clean):
            m = re.search(r'\b(?:open|launch|start)\s+(?:the\s+)?([a-z0-9_\-\.\s]+?\.(?:pptx|ppt|docx|doc|pdf|txt|xlsx|csv|md))\b', clean, re.I)
            if m:
                return m.group(1).strip()

        if matched:
            ext_indicators = [
                ".pptx", "pptx", ".pdf", "pdf", ".docx", "docx", ".txt", "txt",
                ".xlsx", "xlsx", ".md", "powerpoint", "presentation", "d drive", "c drive"
            ]
            if any(ind in target for ind in ext_indicators):
                return target

        return None

    def route_and_execute(
        self,
        message: str,
        session_id: str = "default",
        bypass_ml: bool = False,
        force_local: bool = False,
        confirmation: bool = False
    ) -> ChatResponse:
        t0 = time.perf_counter()
        normalized_text = normalize_text(message)
        errors = []
        tool_used = None
        tool_result = None
        tool_status = None
        gemini_called = False
        model_name = None
        token_usage = None
        requires_confirmation = False
        confirmation_action = None

        # Direct Document / File Launch Check (e.g. "open techmania pptx in my d drive")
        doc_open_target = self._extract_document_open_target(message)
        if doc_open_target and not bypass_ml:
            doc_res = tool_registry.execute_tool("open_application", {"app_name": doc_open_target})
            if doc_res.get("success"):
                tool_used = "open_application"
                tool_result = doc_res
                tool_status = "SUCCESS"
                routing_decision = "LOCAL_TOOL"
                intent = "OPEN_APPLICATION"
                confidence = 0.98
                reply = f"Right away, sir. Accessing and launching '{doc_res.get('app_name')}' from {doc_res.get('executable')}."

                total_time_ms = (time.perf_counter() - t0) * 1000.0
                try:
                    with get_db() as conn:
                        cursor = conn.cursor()
                        cursor.execute("INSERT INTO chat_history (role, content, intent, confidence, routing, tool_used, execution_time_ms) VALUES ('user', ?, ?, ?, ?, ?, ?)", (message, intent, confidence, routing_decision, tool_used, round(total_time_ms, 2)))
                        cursor.execute("INSERT INTO chat_history (role, content, intent, confidence, routing, tool_used, execution_time_ms) VALUES ('assistant', ?, ?, ?, ?, ?, ?)", (reply, intent, confidence, routing_decision, tool_used, round(total_time_ms, 2)))
                except Exception as e:
                    logger.warning("Failed to record conversation: %s", e)

                diagnostics = DiagnosticsData(
                    normalized_input=normalized_text,
                    predicted_intent=intent,
                    confidence=round(confidence, 4),
                    routing_decision=routing_decision,
                    gemini_called=False,
                    tool_selected=tool_used,
                    tool_execution_status=tool_status,
                    processing_time_ms=round(total_time_ms, 2)
                )
                return ChatResponse(
                    reply=reply,
                    intent=intent,
                    confidence=round(confidence, 4),
                    routing=routing_decision,
                    tool_used=tool_used,
                    tool_result=tool_result,
                    diagnostics=diagnostics
                )

        # 1. Prediction & Classification
        if bypass_ml:
            ml_pred = {
                "normalized_text": normalized_text,
                "intent": "BYPASS_TO_GEMINI",
                "confidence": 1.0,
                "probabilities": {},
                "routing_decision": "GEMINI_FALLBACK"
            }
        else:
            ml_pred = predictor.predict(message)

        intent = ml_pred["intent"]
        confidence = ml_pred["confidence"]
        routing_decision = ml_pred["routing_decision"]
        
        reply = ""

        # 2. Local Tool Execution (High confidence & Supported Intent)
        if (routing_decision == "LOCAL_TOOL" or force_local) and not bypass_ml:
            
            # --- OPEN_APPLICATION ---
            if intent == "OPEN_APPLICATION":
                app_name = self._extract_app_name(message)
                tool_used = "open_application"
                tool_result = tool_registry.execute_tool("open_application", {"app_name": app_name})
                tool_status = "SUCCESS" if tool_result.get("success") else "FAILED"
                if tool_result.get("success"):
                    reply = f"Right away, sir. Launched {tool_result.get('app_name')}."
                else:
                    reply = f"I am unable to launch that application, sir: {tool_result.get('error', 'Not permitted')}"

            # --- SEARCH_FILES ---
            elif intent == "SEARCH_FILES":
                q, ext = self._extract_file_query(message)
                tool_used = "search_files"
                tool_result = tool_registry.execute_tool("search_files", {"query": q, "file_type": ext, "max_results": 10})
                tool_status = "SUCCESS" if tool_result.get("success") else "FAILED"
                count = tool_result.get("total_found", 0)
                if count > 0:
                    items = "\n".join([f"• {r['name']} ({r['path']})" for r in tool_result.get("results", [])[:5]])
                    reply = f"I located {count} matching items, sir:\n{items}"
                else:
                    reply = f"I scanned the permitted directories, sir, but found no files matching '{q}'."

            # --- READ_DOCUMENT ---
            elif intent == "READ_DOCUMENT":
                # Find file path mentioned or query
                words = message.split()
                target_file = words[-1] if words else "document.txt"
                tool_used = "read_document"
                tool_result = tool_registry.execute_tool("read_document", {"file_path": target_file})
                tool_status = "SUCCESS" if tool_result.get("success") else "FAILED"
                if tool_result.get("success"):
                    content_preview = tool_result.get("content", "")[:300]
                    reply = f"Document '{target_file}' loaded successfully, sir:\n\n{content_preview}..."
                else:
                    reply = f"Unable to read document: {tool_result.get('error')}"

            # --- SET_REMINDER ---
            elif intent == "SET_REMINDER":
                title, time_part = self._extract_reminder_parts(message)
                tool_used = "set_reminder"
                rem = reminder_service.create_reminder(title, time_part)
                tool_result = rem
                tool_status = "SUCCESS"
                reply = f"Reminder confirmed, sir: '{title}' scheduled for {rem['scheduled_time']}."

            # --- VIEW_REMINDERS ---
            elif intent == "VIEW_REMINDERS":
                tool_used = "view_reminders"
                reminders = reminder_service.get_reminders()
                tool_result = {"total": len(reminders), "reminders": reminders}
                tool_status = "SUCCESS"
                if reminders:
                    rems_str = "\n".join([f"• [{r['status']}] {r['title']} (Due: {r['scheduled_time']})" for r in reminders[:8]])
                    reply = f"You have {len(reminders)} scheduled reminders, sir:\n{rems_str}"
                else:
                    reply = "You currently have no scheduled reminders in the queue, sir."

            # --- SYSTEM_CONTROL ---
            elif intent == "SYSTEM_CONTROL":
                tool_used = "system_control"
                norm_msg = normalized_text
                action = "get_stats"
                if "lock" in norm_msg:
                    action = "lock"
                elif "unmute" in norm_msg:
                    action = "unmute"
                elif "mute" in norm_msg:
                    action = "mute"

                if action == "lock" and not confirmation:
                    requires_confirmation = True
                    confirmation_action = "lock"
                    tool_status = "AWAITING_CONFIRMATION"
                    reply = "Sir, locking the workstation is a consequential action. Please confirm: proceed with locking the workstation?"
                else:
                    tool_result = tool_registry.execute_tool("system_control", {"action": action, "confirm": confirmation})
                    tool_status = "SUCCESS" if tool_result.get("success") else "FAILED"
                    reply = tool_result.get("message", "System control command executed.")

            # --- WEB_SEARCH ---
            elif intent == "WEB_SEARCH":
                tool_used = "web_search"
                q = normalized_text.replace("search the web for", "").replace("search online for", "").replace("search for", "").strip()
                tool_result = tool_registry.execute_tool("web_search", {"query": q})
                tool_status = "SUCCESS" if tool_result.get("success") else "FAILED"
                results = tool_result.get("results", [])
                if results:
                    top = "\n".join([f"• {r['title']}: {r['snippet'][:120]}... ({r['link']})" for r in results[:3]])
                    reply = f"Here are the latest findings from the web, sir:\n{top}"
                else:
                    reply = f"Web search could not retrieve results for '{q}', sir."

        # 3. Cloud LLM / Gemini Fallback
        else:
            gemini_called = True
            gem_resp = gemini_service.generate_response(message)
            reply = gem_resp["reply"]
            model_name = gem_resp.get("model_name")
            token_usage = gem_resp.get("token_usage")
            if gem_resp.get("error"):
                errors.append(gem_resp["error"])
                if intent == "GENERAL_CHAT":
                    reply = "Always at your service, sir. All local systems, tools, and automation subsystems are online and fully operational."

            # Check if Gemini outputted a tool directive (e.g. [TOOL: launch_application | path: "D:\techmania.pptx"])
            tool_match = re.search(r'\[TOOL:\s*(\w+)(?:\s*\|\s*([^\]]+))?\]', reply, flags=re.IGNORECASE)
            if tool_match:
                gem_tool = tool_match.group(1).lower()
                gem_params_raw = tool_match.group(2) or ""
                # Strip tool syntax from spoken/visible reply
                reply = re.sub(r'\[TOOL:[^\]]+\]', '', reply).strip()

                params = {}
                for kv in re.finditer(r'(\w+)\s*[:=]\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s|,]+))', gem_params_raw):
                    k = kv.group(1).lower()
                    v = kv.group(2) or kv.group(3) or kv.group(4)
                    params[k] = v

                target = params.get("path") or params.get("file_path") or params.get("app") or params.get("app_name") or gem_params_raw.strip(' "\'')
                if target and gem_tool in ["launch_application", "open_application", "open_file", "launch"]:
                    logger.info("Executing Gemini tool directive: %s -> %s", gem_tool, target)
                    exec_res = tool_registry.execute_tool("open_application", {"app_name": target, "file_path": target})
                    tool_used = "open_application"
                    tool_status = "SUCCESS" if exec_res.get("success") else "FAILED"
                    tool_result = exec_res

        total_time_ms = (time.perf_counter() - t0) * 1000.0

        # 4. Save to chat history
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO chat_history (role, content, intent, confidence, routing, tool_used, execution_time_ms)
                    VALUES ('user', ?, ?, ?, ?, ?, ?)
                """, (message, intent, confidence, routing_decision, tool_used, round(total_time_ms, 2)))
                cursor.execute("""
                    INSERT INTO chat_history (role, content, intent, confidence, routing, tool_used, execution_time_ms)
                    VALUES ('assistant', ?, ?, ?, ?, ?, ?)
                """, (reply, intent, confidence, routing_decision, tool_used, round(total_time_ms, 2)))
        except Exception as e:
            logger.warning("Failed to record conversation to database: %s", e)

        diagnostics = DiagnosticsData(
            normalized_input=normalized_text,
            predicted_intent=intent,
            confidence=round(confidence, 4),
            routing_decision=routing_decision,
            gemini_called=gemini_called,
            tool_selected=tool_used,
            tool_execution_status=tool_status,
            processing_time_ms=round(total_time_ms, 2),
            model_name=model_name,
            token_usage=token_usage,
            errors=errors if errors else None
        )

        return ChatResponse(
            reply=reply,
            intent=intent,
            confidence=round(confidence, 4),
            routing=routing_decision,
            tool_used=tool_used,
            tool_result=tool_result,
            diagnostics=diagnostics,
            requires_confirmation=requires_confirmation,
            confirmation_action=confirmation_action
        )

hybrid_router = HybridRouter()
