import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Check, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Filter 
} from 'lucide-react';
import { ReminderItem } from '../../types';
import { api } from '../../services/api';

export const RemindersView: React.FC = () => {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  
  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('tomorrow at 10am');

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await api.getReminders();
      setReminders(res.reminders || []);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await api.createReminder(newTitle.trim(), newTime.trim());
      setNewTitle('');
      setIsModalOpen(false);
      fetchReminders();
    } catch (err: any) {
      alert(`Error creating reminder: ${err.message}`);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await api.completeReminder(id);
      fetchReminders();
    } catch (err: any) {
      alert(`Error completing reminder: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteReminder(id);
      fetchReminders();
    } catch (err: any) {
      alert(`Error deleting reminder: ${err.message}`);
    }
  };

  const filteredReminders = reminders.filter(r => {
    if (filter === 'PENDING') return r.status === 'PENDING';
    if (filter === 'COMPLETED') return r.status === 'COMPLETED';
    return true;
  });

  return (
    <div style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="font-display glow-cyan" style={{ fontSize: '20px', color: 'var(--cyan-primary)', margin: 0 }}>
            PERSISTENT REMINDERS &amp; SCHEDULE
          </h2>
          <p className="font-mono" style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            SQLite backed persistent timeline with natural language temporal parsing.
          </p>
        </div>

        <button className="btn-hud" onClick={() => setIsModalOpen(true)}>
          <Plus size={15} />
          <span>NEW REMINDER</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {(['ALL', 'PENDING', 'COMPLETED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className="btn-hud"
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              background: filter === tab ? 'var(--cyan-primary)' : 'rgba(255,255,255,0.05)',
              color: filter === tab ? '#040814' : 'var(--text-muted)',
              borderColor: filter === tab ? 'var(--cyan-primary)' : 'var(--border-subtle)'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Reminders Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading reminders...</div>
      ) : filteredReminders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }} className="font-mono">
          No reminders found in this category. Click &ldquo;NEW REMINDER&rdquo; or ask JARVIS naturally to schedule one.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredReminders.map((r) => (
            <div
              key={r.id}
              className="hud-panel"
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                borderColor: r.is_overdue ? 'var(--amber-warn)' : r.status === 'COMPLETED' ? 'var(--green-online)' : 'var(--border-cyan)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className={`badge-hud ${r.is_overdue ? 'badge-amber' : r.status === 'COMPLETED' ? 'badge-green' : 'badge-cyan'}`}>
                    {r.is_overdue ? 'OVERDUE' : r.status}
                  </span>
                  <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    ID: #{r.id}
                  </span>
                </div>

                <div className="font-display" style={{ fontSize: '15px', color: 'var(--text-main)', textDecoration: r.status === 'COMPLETED' ? 'line-through' : 'none' }}>
                  {r.title}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--cyan-dim)', fontSize: '12px' }} className="font-mono">
                  <Clock size={13} />
                  <span>DUE: {new Date(r.scheduled_time).toLocaleString()}</span>
                </div>
              </div>

              {/* Action Controls */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                {r.status === 'PENDING' && (
                  <button
                    className="btn-hud"
                    onClick={() => handleComplete(r.id)}
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                    title="Mark as completed"
                  >
                    <Check size={13} />
                    <span>COMPLETE</span>
                  </button>
                )}
                <button
                  className="btn-hud btn-hud-danger"
                  onClick={() => handleDelete(r.id)}
                  style={{ padding: '6px 10px', fontSize: '11px' }}
                  title="Delete reminder"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(4, 8, 20, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <div className="hud-panel" style={{ width: '100%', maxWidth: '460px', padding: '24px' }}>
            <h3 className="font-display glow-cyan" style={{ fontSize: '16px', color: 'var(--cyan-primary)', marginBottom: '16px' }}>
              SCHEDULE NEW REMINDER
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                  REMINDER DIRECTIVE / TITLE
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Call client regarding proposal"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-cyan)',
                    padding: '10px 12px',
                    color: 'var(--text-main)',
                    borderRadius: '4px',
                    outline: 'none',
                    fontFamily: 'var(--font-body)'
                  }}
                />
              </div>

              <div>
                <label className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                  SCHEDULED TIME (NATURAL PHRASE OR ISO)
                </label>
                <input
                  type="text"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="e.g. tomorrow at 10am, in 2 hours, 2026-10-22T14:00"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-cyan)',
                    padding: '10px 12px',
                    color: 'var(--text-main)',
                    borderRadius: '4px',
                    outline: 'none',
                    fontFamily: 'var(--font-body)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn-hud btn-hud-secondary" onClick={() => setIsModalOpen(false)}>
                  CANCEL
                </button>
                <button type="submit" className="btn-hud">
                  SCHEDULE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
