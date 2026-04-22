import { useEffect, useState } from 'react';
import { getCars } from '../api/cars';
import { checkRecalls, type Recall } from '../api/recalls';
import type { CarSummary } from '../types/car';

export default function RecallsPage() {
  const [cars, setCars] = useState<CarSummary[]>([]);
  const [selectedCar, setSelectedCar] = useState<CarSummary | null>(null);
  const [recalls, setRecalls] = useState<Recall[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCars().then((c) => {
      const active = c.filter((x) => !x.is_archived);
      setCars(active);
      if (active.length > 0) setSelectedCar(active[0]);
    }).finally(() => setLoading(false));
  }, []);

  const check = async () => {
    if (!selectedCar || !selectedCar.year) return;
    setChecking(true);
    setRecalls(null);
    setError(null);
    try {
      const result = await checkRecalls(selectedCar.make, selectedCar.model, selectedCar.year);
      setRecalls(result);
    } catch {
      setError('Failed to reach NHTSA. Check your internet connection.');
    } finally {
      setChecking(false);
    }
  };

  const handleCarChange = (id: number) => {
    const car = cars.find((c) => c.id === id) ?? null;
    setSelectedCar(car);
    setRecalls(null);
  };

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Recall Checker</div>
          <div className="page-subtitle">Powered by NHTSA public database</div>
        </div>
      </div>

      <div className="form-section" style={{ marginBottom: '24px' }}>
        <div className="form-section-title">Select Vehicle</div>
        <div style={{ padding: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedCar?.id ?? ''}
            onChange={(e) => handleCarChange(Number(e.target.value))}
            style={{ minWidth: '220px' }}
          >
            {cars.map((c) => <option key={c.id} value={c.id}>{c.year} {c.make} {c.model}</option>)}
          </select>
          {selectedCar && (
            <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              {selectedCar.year} · {selectedCar.make} · {selectedCar.model}
            </div>
          )}
          <button className="btn btn-primary" onClick={check} disabled={checking || !selectedCar?.year}>
            {checking ? <><span className="spinner" style={{ width: '14px', height: '14px', marginRight: '6px' }} />Checking…</> : '🔍 Check Recalls'}
          </button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {recalls !== null && (
        recalls.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">No open recalls found</div>
            <div className="empty-state-sub">
              No recalls on record for the {selectedCar?.year} {selectedCar?.make} {selectedCar?.model} in the NHTSA database.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '4px' }}>
              {recalls.length} recall{recalls.length !== 1 ? 's' : ''} found for the {selectedCar?.year} {selectedCar?.make} {selectedCar?.model}
            </div>
            {recalls.map((r, i) => (
              <div key={i} className="form-section" style={{ marginBottom: 0 }}>
                <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{r.component || 'Unknown Component'}</span>
                  {r.recall_id && <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-3)' }}>#{r.recall_id}</span>}
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {r.summary && (
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-3)', marginBottom: '4px' }}>Summary</div>
                      <div style={{ fontSize: '13px', lineHeight: 1.6 }}>{r.summary}</div>
                    </div>
                  )}
                  {r.consequence && (
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--danger)', marginBottom: '4px' }}>Risk</div>
                      <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-2)' }}>{r.consequence}</div>
                    </div>
                  )}
                  {r.remedy && (
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--success)', marginBottom: '4px' }}>Remedy</div>
                      <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-2)' }}>{r.remedy}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
