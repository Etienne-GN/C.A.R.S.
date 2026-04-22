import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFusePanels } from '../api/fuses';
import type { FusePanelSummary } from '../types/fuses';

export default function FusesListPage() {
  const [panels, setPanels] = useState<FusePanelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getFusePanels(ctrl.signal)
      .then(setPanels)
      .catch(() => setError('Failed to load fuse panels.'))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Fuse Panels</div>
          <div className="page-subtitle">{panels.length} reference{panels.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {panels.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚡</div>
          <div className="empty-state-title">No fuse panels</div>
          <div className="empty-state-sub">Drop a JSON file into backend/app/modules/fuses/data/ to add one.</div>
        </div>
      ) : (
        <div className="car-grid">
          {panels.map((p) => (
            <Link key={p.key} to={`/modules/fuses/${p.key}`} className="car-card">
              <div className="car-card-header">
                <div>
                  <div className="car-card-title">{p.title}</div>
                  <div className="car-card-subtitle">{p.description}</div>
                </div>
                <span className="badge badge-plate">⚡</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
