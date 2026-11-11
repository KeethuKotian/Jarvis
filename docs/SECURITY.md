# JARVIS Security Architecture & Guardrails

## 1. Principles of Least Privilege & Sandboxing

JARVIS treats all LLM outputs as untrusted input. The assistant enforces strict boundary controls to guarantee system integrity.

### A. Application Launching Allowlist
- Arbitrary executable launching and shell command execution (`cmd.exe /c ...`, `powershell.exe -Command ...`) are **strictly prohibited**.
- The `AppLauncher` checks every request against an explicit dictionary (`settings.ALLOWED_APPLICATIONS`).
- Subprocesses are spawned directly with argument lists without `shell=True`.

### B. Directory Sandboxing & Path Traversal Prevention
- File searching and document reading are strictly restricted to configured directories (`settings.ALLOWED_DIRECTORIES`).
- Paths are resolved to their canonical form using `Path.resolve()`.
- Access is denied if `os.path.commonpath([target, allowed]) != allowed`.
- Sensitive system locations (`C:\Windows`, `Program Files`, `AppData`) are excluded by default.

### C. Consequential System Action Confirmation
- System operations that affect the user workstation (such as workstation locking) require an explicit human confirmation step.
- The UI renders an authorization dialog before the directive is executed.

### D. Memory Sanitization & Secret Rejection
- Conversational memories are never recorded automatically without explicit user action.
- Every memory submission passes through regex patterns that intercept API keys (`AQ.*`, `AIza*`), passwords, and authorization tokens.

### E. Secret Protection & API Key Masking
- The Gemini API key is loaded only server-side from `backend/.env`.
- Secrets are never transmitted to the React frontend.
- Custom logging formatters redact all API keys from standard output.

### F. SQLite Audit Trail
- Every tool invocation records an entry in `tool_audit_logs` storing the timestamp, tool name, sanitized parameters, execution latency, and success status.
