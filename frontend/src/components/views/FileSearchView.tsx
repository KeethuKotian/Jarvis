import React, { useState } from 'react';
import { Search, FileText, Folder, Eye, X, BookOpen, AlertCircle, FileCode } from 'lucide-react';
import { FileSearchResult } from '../../types';
import { api } from '../../services/api';

export const FileSearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [fileType, setFileType] = useState<string>('');
  const [results, setResults] = useState<FileSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Document reader state
  const [selectedDoc, setSelectedDoc] = useState<{
    path: string;
    content: string;
    charCount: number;
    fileType: string;
    truncated: boolean;
  } | null>(null);
  const [readingDoc, setReadingDoc] = useState(false);

  const filterOptions = ['', '.pdf', '.txt', '.docx', '.json', '.py', '.md'];

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.searchFiles(query, fileType || undefined);
      setResults(res.results || []);
    } catch (err: any) {
      setError(err.message || 'Error executing file search.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReadDocument = async (filePath: string) => {
    setReadingDoc(true);
    try {
      const res = await api.readDocument(filePath, 6000);
      setSelectedDoc({
        path: res.file_path,
        content: res.content,
        charCount: res.char_count,
        fileType: res.file_type,
        truncated: res.truncated
      });
    } catch (err: any) {
      alert(`Could not read document: ${err.message}`);
    } finally {
      setReadingDoc(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 className="font-display glow-cyan" style={{ fontSize: '20px', color: 'var(--cyan-primary)', margin: 0 }}>
          FILE SYSTEM &amp; DOCUMENT RETRIEVAL
        </h2>
        <p className="font-mono" style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Boundary-restricted file indexer and secure document reader.
        </p>
      </div>

      {/* Search Input and Type Filters */}
      <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="hud-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '6px 14px', gap: '10px' }}>
            <Search size={18} color="var(--cyan-primary)" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by filename or keyword (e.g. 'Buildthis', 'report', 'invoice')..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '15px',
                fontFamily: 'var(--font-body)'
              }}
            />
          </div>
          <button type="submit" className="btn-hud" disabled={loading} style={{ padding: '10px 24px' }}>
            {loading ? 'SCANNING...' : 'SEARCH FILES'}
          </button>
        </div>

        {/* Extension Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>FILTER TYPE:</span>
          {filterOptions.map((ext) => (
            <button
              key={ext || 'all'}
              type="button"
              onClick={() => {
                setFileType(ext);
              }}
              className="btn-hud"
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '12px',
                background: fileType === ext ? 'var(--cyan-primary)' : 'rgba(255,255,255,0.05)',
                color: fileType === ext ? '#040814' : 'var(--text-muted)',
                borderColor: fileType === ext ? 'var(--cyan-primary)' : 'var(--border-subtle)'
              }}
            >
              {ext ? ext.toUpperCase() : 'ALL TYPES'}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="hud-panel" style={{ padding: '12px', borderColor: 'var(--red-alert)', color: 'var(--red-alert)', marginBottom: '16px', display: 'flex', gap: '10px' }}>
          <AlertCircle size={18} />
          <span className="font-mono" style={{ fontSize: '13px' }}>{error}</span>
        </div>
      )}

      {/* Main Container: Split Search Results & Document Reader Drawer */}
      <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>
        {/* Results List */}
        <div className="hud-panel" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '12px' }}>
            MATCHED FILES: {results.length} ITEMS
          </div>

          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              Enter search query to scan permitted directories.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {results.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <FileText size={18} color="var(--cyan-primary)" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div className="font-display" style={{ fontSize: '13px', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name}
                      </div>
                      <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.path}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {(f.size_bytes / 1024).toFixed(1)} KB
                    </span>
                    <button
                      className="btn-hud"
                      onClick={() => handleReadDocument(f.path)}
                      style={{ padding: '6px 12px', fontSize: '10px' }}
                      title="Inspect and extract document contents"
                    >
                      <Eye size={12} />
                      <span>READ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Reader Preview Drawer */}
        {selectedDoc && (
          <div
            className="hud-panel"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(8, 16, 36, 0.95)',
              borderColor: 'var(--cyan-primary)'
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} color="var(--cyan-primary)" />
                <span className="font-display" style={{ fontSize: '12px', color: 'var(--cyan-primary)' }}>
                  DOCUMENT EXTRACTOR [{selectedDoc.fileType.toUpperCase()}]
                </span>
              </div>
              <button className="btn-hud btn-hud-secondary" onClick={() => setSelectedDoc(null)} style={{ padding: '4px' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '11px' }} className="font-mono">
              <div style={{ color: 'var(--text-dim)' }}>PATH: {selectedDoc.path}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                CHARACTERS EXTRACTED: {selectedDoc.charCount} {selectedDoc.truncated ? '(TRUNCATED TO LIMIT)' : ''}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: 1.6,
                color: 'var(--text-main)',
                whiteSpace: 'pre-wrap',
                background: 'rgba(0, 0, 0, 0.25)'
              }}
            >
              {selectedDoc.content || 'Document contains no readable text content.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
