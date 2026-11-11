import {
  HealthStatus,
  ChatMessage,
  ReminderItem,
  MemoryItem,
  FileSearchResult,
  MLMetrics,
  RoutingExperiments,
  ToolAuditLog
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) errorDetail = errJson.detail;
      else if (errJson.error) errorDetail = errJson.error;
    } catch {
      // Use fallback error message
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Health
  getHealth: (): Promise<HealthStatus> => fetchJson<HealthStatus>('/api/health'),

  // Chat & Confirmation
  sendMessage: (message: string, options?: {
    sessionId?: string;
    voiceEnabled?: boolean;
    bypassMl?: boolean;
    forceLocal?: boolean;
  }) => fetchJson<any>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      session_id: options?.sessionId || 'default',
      voice_enabled: options?.voiceEnabled ?? false,
      bypass_ml: options?.bypassMl ?? false,
      force_local: options?.forceLocal ?? false
    })
  }),

  confirmAction: (action: string, originalMessage: string) => 
    fetchJson<any>(`/api/chat/confirm?action=${encodeURIComponent(action)}&original_message=${encodeURIComponent(originalMessage)}`, {
      method: 'POST'
    }),

  // Intent
  predictIntent: (text: string) => fetchJson<any>('/api/intent/predict', {
    method: 'POST',
    body: JSON.stringify({ text })
  }),

  getMLMetrics: (): Promise<MLMetrics> => fetchJson<MLMetrics>('/api/intent/metrics'),

  // Tools
  getAllowedApps: (): Promise<{ allowed_applications: string[] }> => fetchJson('/api/tools/allowed-apps'),

  launchApp: (appName: string) => fetchJson<any>('/api/tools/launch-app', {
    method: 'POST',
    body: JSON.stringify({ app_name: appName })
  }),

  searchFiles: (query: string, fileType?: string, directory?: string, maxResults: number = 20): Promise<{
    success: boolean;
    total_found: number;
    results: FileSearchResult[];
    message: string;
  }> => fetchJson('/api/tools/search-files', {
    method: 'POST',
    body: JSON.stringify({
      query,
      file_type: fileType || null,
      directory: directory || null,
      max_results: maxResults
    })
  }),

  readDocument: (filePath: string, maxChars: number = 5000) => fetchJson<{
    success: boolean;
    file_path: string;
    file_type: string;
    content: string;
    char_count: number;
    truncated: boolean;
  }>('/api/tools/read-document', {
    method: 'POST',
    body: JSON.stringify({ file_path: filePath, max_chars: maxChars })
  }),

  systemControl: (action: string, confirm: boolean = false) => fetchJson<any>('/api/tools/system-control', {
    method: 'POST',
    body: JSON.stringify({ action, confirm })
  }),

  webSearch: (query: string, maxResults: number = 5) => fetchJson<{
    success: boolean;
    query: string;
    results: Array<{ title: string; link: string; snippet: string }>;
    message: string;
  }>('/api/tools/web-search', {
    method: 'POST',
    body: JSON.stringify({ query, max_results: maxResults })
  }),

  // Reminders
  getReminders: (status?: string): Promise<{ success: boolean; total: number; reminders: ReminderItem[] }> =>
    fetchJson(status ? `/api/reminders?status=${status}` : '/api/reminders'),

  createReminder: (title: string, scheduledTime: string): Promise<ReminderItem> =>
    fetchJson('/api/reminders', {
      method: 'POST',
      body: JSON.stringify({ title, scheduled_time: scheduledTime })
    }),

  completeReminder: (reminderId: number) => fetchJson(`/api/reminders/${reminderId}/complete`, { method: 'PUT' }),

  deleteReminder: (reminderId: number) => fetchJson(`/api/reminders/${reminderId}`, { method: 'DELETE' }),

  // Memory
  getMemories: (activeOnly: boolean = false): Promise<{ success: boolean; total: number; memories: MemoryItem[] }> =>
    fetchJson(`/api/memory?active_only=${activeOnly}`),

  addMemory: (key: string, content: string, category: string = 'user_preference'): Promise<MemoryItem> =>
    fetchJson('/api/memory', {
      method: 'POST',
      body: JSON.stringify({ key, content, category })
    }),

  updateMemory: (id: number, data: { content?: string; category?: string; is_active?: boolean }) =>
    fetchJson(`/api/memory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteMemory: (id: number) => fetchJson(`/api/memory/${id}`, { method: 'DELETE' }),

  clearMemories: () => fetchJson('/api/memory', { method: 'DELETE' }),

  toggleMemorySystem: (enabled: boolean) => fetchJson(`/api/memory/toggle?enabled=${enabled}`, { method: 'POST' }),

  // Diagnostics & Telemetry
  getDiagnosticsEvaluation: (): Promise<MLMetrics> => fetchJson('/api/diagnostics/evaluation'),

  getDiagnosticsExperiments: (): Promise<RoutingExperiments> => fetchJson('/api/diagnostics/experiments'),

  getAuditLogs: (limit: number = 50): Promise<{ total: number; audit_logs: ToolAuditLog[] }> =>
    fetchJson(`/api/diagnostics/audit-logs?limit=${limit}`)
};
