import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Plus, 
  Trash2, 
  Edit2, 
  ShieldAlert, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  X 
} from 'lucide-react';
import { MemoryItem } from '../../types';
import { api } from '../../services/api';

export const MemoryView: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(true);

  // New Memory Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newKey, setNewKey] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('user_preference');

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await api.getMemories();
      setMemories(res.memories || []);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newContent.trim()) return;
    try {
      await api.addMemory(newKey.trim(), newContent.trim(), newCategory);
      setNewKey('');
      setNewContent('');
      setIsModalOpen(false);
      fetchMemories();
    } catch (err: any) {
      alert(`Memory storage rejected: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteMemory(id);
      fetchMemories();
    } catch (err: any) {
      alert(`Error deleting memory: ${err.message}`);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you certain you wish to purge ALL saved memories from persistent storage?')) {
      try {
        await api.clearMemories();
        fetchMemories();
      } catch (err: any) {
        alert(`Error clearing memories: ${err.message}`);
      }
    }
  };

  const handleToggleSystem = async () => {
    const next = !memoryEnabled;
    try {
      await api.toggleMemorySystem(next);
      setMemoryEnabled(next);
    } catch (err: any) {
      alert(`Error toggling memory feature: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="font-display glow-cyan" style={{ fontSize: '20px', color: 'var(--cyan-primary)', margin: 0 }}>
            TRANSPARENT MEMORY VAULT
          </h2>
          <p className="font-mono" style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            User-approved preferences and operational context. Strictly no secrets or credentials stored.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn-hud ${memoryEnabled ? '' : 'btn-hud-secondary'}`}
            onClick={handleToggleSystem}
            style={{ fontSize: '12px', padding: '8px 14px' }}
          >
            {memoryEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            <span>{memoryEnabled ? 'MEMORY: ACTIVE' : 'MEMORY: DISABLED'}</span>
          </button>

          <button className="btn-hud" onClick={() => setIsModalOpen(true)} disabled={!memoryEnabled}>
            <Plus size={15} />
            <span>ADD MEMORY</span>
          </button>

          {memories.length > 0 && (
            <button className="btn-hud btn-hud-danger" onClick={handleClearAll}>
              <Trash2 size={15} />
              <span>CLEAR ALL</span>
            </button>
          )}
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div 
        className="hud-panel" 
        style={{ 
          padding: '12px 18px', 
          marginBottom: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          background: 'rgba(8, 16, 36, 0.6)',
          borderColor: 'var(--border-cyan)'
        }}
      >
        <ShieldAlert size={20} color="var(--cyan-primary)" style={{ flexShrink: 0 }} />
        <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          PRIVACY GUARANTEE: Memories are only recorded with your explicit approval. Passwords, API tokens, and secret keys are automatically rejected by regex sanitization filters.
        </div>
      </div>

      {/* Memories Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading memories...</div>
      ) : memories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }} className="font-mono">
          Memory vault is currently empty. Add user preferences or project context to personalize JARVIS responses.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {memories.map((m) => (
            <div
              key={m.id}
              className="hud-panel"
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge-hud badge-purple">
                    {m.category.toUpperCase()}
                  </span>
                  <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    #{m.id}
                  </span>
                </div>

                <div className="font-display" style={{ fontSize: '14px', color: 'var(--cyan-primary)', marginBottom: '6px' }}>
                  {m.key}
                </div>

                <div style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {m.content}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                  UPDATED: {new Date(m.updated_at).toLocaleDateString()}
                </span>
                <button
                  className="btn-hud btn-hud-danger"
                  onClick={() => handleDelete(m.id)}
                  style={{ padding: '4px 8px', fontSize: '10px' }}
                  title="Delete memory item"
                >
                  <Trash2 size={12} />
                  <span>FORGET</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Memory Modal */}
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
          <div className="hud-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <h3 className="font-display glow-cyan" style={{ fontSize: '16px', color: 'var(--cyan-primary)', marginBottom: '16px' }}>
              RECORD NEW USER MEMORY
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                  IDENTIFIER KEY / TOPIC
                </label>
                <input
                  type="text"
                  required
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. user_preferred_name, preferred_ide, coffee_preference"
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
                  CATEGORY
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#070d20',
                    border: '1px solid var(--border-cyan)',
                    padding: '10px 12px',
                    color: 'var(--text-main)',
                    borderRadius: '4px',
                    outline: 'none',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  <option value="user_preference">User Preference</option>
                  <option value="work_context">Work &amp; Project Context</option>
                  <option value="personal">Personal Note</option>
                  <option value="system_directive">System Directive</option>
                </select>
              </div>

              <div>
                <label className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                  MEMORY CONTENT
                </label>
                <textarea
                  required
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="e.g. Call me Keerthan. My default IDE is VS Code."
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-cyan)',
                    padding: '10px 12px',
                    color: 'var(--text-main)',
                    borderRadius: '4px',
                    outline: 'none',
                    fontFamily: 'var(--font-body)',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn-hud btn-hud-secondary" onClick={() => setIsModalOpen(false)}>
                  CANCEL
                </button>
                <button type="submit" className="btn-hud">
                  COMMIT MEMORY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
