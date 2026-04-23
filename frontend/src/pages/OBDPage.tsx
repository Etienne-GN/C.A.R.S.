import { useEffect, useState } from 'react';
import api from '../api/client';

interface OBDCode {
  code: string;
  description: string;
  system: string;
  severity: 'low' | 'moderate' | 'high';
}

const SEVERITY_COLOR: Record<string, string> = {
  low: 'var(--success)',
  moderate: 'var(--warning)',
  high: 'var(--danger)',
};

export default function OBDPage() {
  const [codes, setCodes] = useState<OBDCode[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    api.get<OBDCode[]>('/modules/obd/', { signal: ctrl.signal })
      .then((r) => setCodes(r.data))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  const filtered = query.trim()
    ? codes.filter((c) => {
        const q = query.toUpperCase();
        return c.code.includes(q) || c.description.toUpperCase().includes(q) || c.system.toUpperCase().includes(q);
      })
    : codes;

  const systems = [...new Set(filtered.map((c) => c.system))].sort();

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">OBD Codes</div>
          <div className="page-subtitle">{codes.length} codes in database</div>
        </div>
        <input
          type="search"
          placeholder="Search code or keyword (e.g. P0420, misfire)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%', maxWidth: '280px' }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔌</div>
          <div className="empty-state-title">No codes match "{query}"</div>
        </div>
      ) : (
        systems.map((system) => {
          const group = filtered.filter((c) => c.system === system);
          return (
            <div key={system} className="form-section" style={{ marginBottom: '16px' }}>
              <div className="form-section-title">{system}</div>
              <div style={{ overflowX: 'auto' }}><table className="parts-table">
                <thead>
                  <tr>
                    <th style={{ width: '90px' }}>Code</th>
                    <th>Description</th>
                    <th style={{ width: '90px' }}>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {group.map((c) => (
                    <tr key={c.code}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px' }}>{c.code}</td>
                      <td>{c.description}</td>
                      <td>
                        <span style={{ color: SEVERITY_COLOR[c.severity], fontWeight: 600, fontSize: '12px', textTransform: 'capitalize' }}>
                          {c.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          );
        })
      )}
    </div>
  );
}
