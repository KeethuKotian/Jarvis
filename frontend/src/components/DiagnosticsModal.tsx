import React, { useState, useEffect } from 'react';
import { X, Activity, Cpu, Server, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { DiagnosticsData, MLMetrics, ToolAuditLog } from '../types';
import { api } from '../services/api';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  latestDiagnostics?: DiagnosticsData | null;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  latestDiagnostics
}) => {
  const [activeTab, setActiveTab] = useState<'decision_flow' | 'model_metrics' | 'audit_logs'>('decision_flow');
  const [metrics, setMetrics] = useState<MLMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<ToolAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([
        api.getDiagnosticsEvaluation().catch(() => null),
        api.getAuditLogs(20).catch(() => ({ total: 0, audit_logs: [] }))
      ]).then(([metricsData, logsData]) => {
        if (metricsData) setMetrics(metricsData);
        if (logsData?.audit_logs) setAuditLogs(logsData.audit_logs);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(4, 8, 20, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 10000
      }}
    >
      <div
        className="hud-panel"
        style={{
          width: '100%',
          maxWidth: '650px',
          height: '100%',
          borderRadius: 0,
          borderRight: 'none',
          borderTop: 'none',
          borderBottom: 'none',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(7, 13, 30, 0.98)',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={18} color="var(--cyan-primary)" />
            <h2 className="font-display glow-cyan" style={{ fontSize: '15px', margin: 0, color: 'var(--cyan-primary)' }}>
              DEVELOPER DIAGNOSTICS &amp; ML TRANSPARENCY
            </h2>
          </div>
          <button className="btn-hud btn-hud-secondary" onClick={onClose} style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Diagnostic Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px' }}>
          {[
            { id: 'decision_flow', label: 'LATEST ROUTING' },
            { id: 'model_metrics', label: 'EVALUATION METRICS' },
            { id: 'audit_logs', label: 'TOOL AUDIT TRAIL' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className="font-display"
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === t.id ? '2px solid var(--cyan-primary)' : '2px solid transparent',
                color: activeTab === t.id ? 'var(--cyan-primary)' : 'var(--text-muted)',
                padding: '12px 16px',
                fontSize: '11px',
                letterSpacing: '1px',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'decision_flow' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {latestDiagnostics ? (
                <>
                  <div className="hud-panel" style={{ padding: '16px' }}>
                    <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      NORMALIZED USER INPUT
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      &ldquo;{latestDiagnostics.normalized_input}&rdquo;
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="hud-panel" style={{ padding: '14px' }}>
                      <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>PREDICTED INTENT</div>
                      <div className="font-display" style={{ fontSize: '14px', color: 'var(--cyan-primary)', marginTop: '4px' }}>
                        {latestDiagnostics.predicted_intent}
                      </div>
                    </div>

                    <div className="hud-panel" style={{ padding: '14px' }}>
                      <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>CONFIDENCE SCORE</div>
                      <div className="font-display" style={{ fontSize: '14px', color: 'var(--blue-bright)', marginTop: '4px' }}>
                        {(latestDiagnostics.confidence * 100).toFixed(1)}%
                      </div>
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', marginTop: '6px', borderRadius: '2px' }}>
                        <div 
                          style={{ 
                            width: `${Math.min(100, latestDiagnostics.confidence * 100)}%`, 
                            height: '100%', 
                            background: 'var(--cyan-primary)' 
                          }} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="hud-panel" style={{ padding: '16px' }}>
                    <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px' }}>
                      ROUTING ARTIFACT DETAILS
                    </div>
                    <table style={{ width: '100%', fontSize: '12px', color: 'var(--text-main)', borderCollapse: 'collapse' }} className="font-mono">
                      <tbody>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Decision:</td>
                          <td style={{ padding: '8px 0', textAlign: 'right' }}>
                            <span className="badge-hud badge-cyan">{latestDiagnostics.routing_decision}</span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Gemini API Invoked:</td>
                          <td style={{ padding: '8px 0', textAlign: 'right' }}>
                            {latestDiagnostics.gemini_called ? 'YES (Cloud Fallback)' : 'NO (Fast Local Path)'}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Computer Tool:</td>
                          <td style={{ padding: '8px 0', textAlign: 'right' }}>
                            {latestDiagnostics.tool_selected || 'None'}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Processing Latency:</td>
                          <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--cyan-primary)' }}>
                            {latestDiagnostics.processing_time_ms} ms
                          </td>
                        </tr>
                        {latestDiagnostics.token_usage && (
                          <tr>
                            <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Token Usage:</td>
                            <td style={{ padding: '8px 0', textAlign: 'right' }}>
                              {latestDiagnostics.token_usage.total_tokens} tokens ({latestDiagnostics.token_usage.prompt_tokens} prompt / {latestDiagnostics.token_usage.candidates_tokens} resp)
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <Terminal size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div>No queries executed in current session yet.</div>
                  <div className="font-mono" style={{ fontSize: '12px', marginTop: '6px' }}>Send a message to view the live ML routing pipeline.</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'model_metrics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {metrics ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div className="hud-panel" style={{ padding: '12px', textAlign: 'center' }}>
                      <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>TEST ACCURACY</div>
                      <div className="font-display" style={{ fontSize: '18px', color: 'var(--cyan-primary)', marginTop: '4px' }}>
                        {(metrics.accuracy * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="hud-panel" style={{ padding: '12px', textAlign: 'center' }}>
                      <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>MACRO F1</div>
                      <div className="font-display" style={{ fontSize: '18px', color: 'var(--purple-ai)', marginTop: '4px' }}>
                        {(metrics.macro_f1 * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="hud-panel" style={{ padding: '12px', textAlign: 'center' }}>
                      <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>AVG LATENCY</div>
                      <div className="font-display" style={{ fontSize: '18px', color: 'var(--green-online)', marginTop: '4px' }}>
                        {metrics.average_latency_ms.toFixed(2)} ms
                      </div>
                    </div>
                  </div>

                  <div className="hud-panel" style={{ padding: '16px' }}>
                    <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '10px' }}>
                      PER-CLASS EVALUATION METRICS (HELD-OUT TEST SET)
                    </div>
                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }} className="font-mono">
                      <thead>
                        <tr style={{ color: 'var(--text-dim)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ textAlign: 'left', padding: '6px 0' }}>Class</th>
                          <th style={{ textAlign: 'right', padding: '6px 0' }}>Prec</th>
                          <th style={{ textAlign: 'right', padding: '6px 0' }}>Rec</th>
                          <th style={{ textAlign: 'right', padding: '6px 0' }}>F1</th>
                          <th style={{ textAlign: 'right', padding: '6px 0' }}>Supp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(metrics.per_class_metrics).map(([cls, data]) => (
                          <tr key={cls} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '6px 0', color: 'var(--text-main)' }}>{cls}</td>
                            <td style={{ padding: '6px 0', textAlign: 'right' }}>{(data.precision * 100).toFixed(0)}%</td>
                            <td style={{ padding: '6px 0', textAlign: 'right' }}>{(data.recall * 100).toFixed(0)}%</td>
                            <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--cyan-primary)' }}>
                              {(((data.f1_score ?? data['f1-score'] ?? 0) * 100)).toFixed(0)}%
                            </td>
                            <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--text-dim)' }}>{data.support}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading model metrics...</div>
              )}
            </div>
          )}

          {activeTab === 'audit_logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="hud-panel" style={{ padding: '12px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="font-display" style={{ color: 'var(--cyan-primary)', fontSize: '12px' }}>
                        {log.tool_name}
                      </span>
                      <span className={`badge-hud ${log.status === 'SUCCESS' ? 'badge-green' : 'badge-red'}`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      Time: {new Date(log.created_at).toLocaleTimeString()} • Latency: {log.execution_time_ms} ms
                    </div>
                    <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Params: {log.parameters}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No audit logs recorded yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
