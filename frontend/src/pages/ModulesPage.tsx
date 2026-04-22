import { useState } from 'react';
import { updateModule } from '../api/modules';
import { useModules } from '../context/ModulesContext';
import type { ModuleInfo } from '../types/module';

export default function ModulesPage() {
  const { modules, refresh } = useModules();
  const loading = modules.length === 0;
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = async (mod: ModuleInfo) => {
    setToggling(mod.key);
    try {
      await updateModule(mod.key, !mod.is_enabled);
      refresh();
    } catch {
      setError('Failed to update module.');
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Modules</div>
          <div className="page-subtitle">Activate modules to add them to the sidebar</div>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {modules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧩</div>
          <div className="empty-state-title">No modules available</div>
          <div className="empty-state-sub">Drop a module folder into backend/app/modules/ to add one.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {modules.map((mod) => (
            <div
              key={mod.key}
              className="form-section"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', marginBottom: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '28px' }}>{mod.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{mod.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{mod.description}</div>
                </div>
              </div>
              <button
                className={`btn ${mod.is_enabled ? 'btn-secondary' : 'btn-primary'}`}
                disabled={toggling === mod.key}
                onClick={() => toggle(mod)}
                style={{ minWidth: '100px' }}
              >
                {toggling === mod.key ? '…' : mod.is_enabled ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
