export type AssistantState = 'IDLE' | 'LISTENING' | 'THINKING' | 'EXECUTING' | 'SPEAKING' | 'ERROR';

export type NavigationTab = 
  | 'command_center'
  | 'chat_history'
  | 'tools'
  | 'file_search'
  | 'reminders'
  | 'memory'
  | 'ml_diagnostics'
  | 'system_status'
  | 'settings';

export interface DiagnosticsData {
  normalized_input: string;
  predicted_intent: string;
  confidence: number;
  routing_decision: string;
  gemini_called: boolean;
  tool_selected?: string | null;
  tool_execution_status?: string | null;
  processing_time_ms: number;
  model_name?: string | null;
  token_usage?: {
    prompt_tokens: number;
    candidates_tokens: number;
    total_tokens: number;
  } | null;
  errors?: string[] | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  intent?: string;
  confidence?: number;
  routing?: string;
  tool_used?: string | null;
  tool_result?: any;
  diagnostics?: DiagnosticsData;
  requires_confirmation?: boolean;
  confirmation_action?: string | null;
}

export interface ReminderItem {
  id: number;
  title: string;
  scheduled_time: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  completed_at?: string | null;
  is_overdue?: boolean;
}

export interface MemoryItem {
  id: number;
  category: string;
  key: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FileSearchResult {
  name: string;
  path: string;
  size_bytes: number;
  modified_time: string;
  extension: string;
}

export interface SystemTelemetry {
  cpu_percent: number;
  ram_percent: number;
  ram_used_gb: number;
  ram_total_gb: number;
  battery_percent?: number | null;
  power_plugged?: boolean | null;
  disk_free_gb?: number | null;
  disk_total_gb?: number | null;
  process_count?: number;
}

export interface HealthStatus {
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  system: string;
  environment: string;
  database_connected: boolean;
  ml_classifier_loaded: boolean;
  gemini_status: string;
  gemini_model: string;
  telemetry: SystemTelemetry;
}

export interface MLMetrics {
  accuracy: number;
  macro_f1: number;
  average_latency_ms: number;
  p95_latency_ms: number;
  calibrated_threshold: number;
  classes: string[];
  per_class_metrics: Record<string, {
    precision: number;
    recall: number;
    f1_score?: number;
    'f1-score'?: number;
    support: number;
  }>;
  confusion_matrix: number[][];
  misclassifications_count: number;
  misclassifications: Array<{
    query: string;
    actual_intent: string;
    predicted_intent: string;
    confidence: number;
  }>;
  limitations_analysis: string[];
}

export interface RoutingExperiments {
  total_test_samples: number;
  models_compared: string[];
  metrics: {
    local_ml_only: {
      accuracy: number;
      avg_latency_ms: number;
      api_calls: number;
      token_usage_estimated: number;
      failure_rate: number;
      pros: string;
      cons: string;
    };
    gemini_only: {
      accuracy: number;
      avg_latency_ms: number;
      api_calls: number;
      token_usage_estimated: number;
      failure_rate: number;
      pros: string;
      cons: string;
    };
    hybrid_ml_gemini: {
      accuracy: number;
      avg_latency_ms: number;
      api_calls: number;
      token_usage_estimated: number;
      api_call_reduction_percent: number;
      failure_rate: number;
      pros: string;
      cons: string;
    };
  };
  conclusion: string;
}

export interface ToolAuditLog {
  id: number;
  tool_name: string;
  parameters: string;
  status: string;
  execution_time_ms: number;
  error_message?: string | null;
  created_at: string;
}
