import { type FormEvent, useEffect, useState } from 'react';
import { getCars } from '../api/cars';
import { createTrip, deleteTrip, getTrips } from '../api/logbook';
import type { CarSummary } from '../types/car';
import type { TripLog, TripLogCreate } from '../types/logbook';

const PURPOSE_OPTIONS = ['Personal', 'Work', 'Medical', 'Charity', 'Moving', 'Other'];

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDuration(min?: number) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`;
}

function fmtCurrency(n?: number) {
  if (n == null) return null;
  return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
}

const EMPTY: TripLogCreate = {
  date: new Date().toISOString().slice(0, 10),
  distance_km: 0,
  start_location: '',
  end_location: '',
  duration_min: undefined,
  purpose: '',
  fuel_cost: undefined,
  notes: '',
};

export default function LogbookPage() {
  const [cars, setCars] = useState<CarSummary[]>([]);
  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  const [trips, setTrips] = useState<TripLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<TripLogCreate>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCars().then((c) => {
      const active = c.filter((x) => !x.is_archived);
      setCars(active);
      if (active.length > 0) setSelectedCar(active[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCar) return;
    setTrips([]);
    getTrips(selectedCar).then(setTrips).catch(() => setError('Failed to load logbook.'));
  }, [selectedCar]);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;
    setSubmitting(true);
    try {
      const payload: TripLogCreate = {
        ...form,
        start_location: form.start_location || undefined,
        end_location: form.end_location || undefined,
        purpose: form.purpose || undefined,
        notes: form.notes || undefined,
      };
      const trip = await createTrip(selectedCar, payload);
      setTrips((prev) => [trip, ...prev]);
      setForm(EMPTY);
      setAdding(false);
    } catch {
      setError('Failed to save trip.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteTrip(id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  const totalKm = trips.reduce((s, t) => s + t.distance_km, 0);
  const totalCost = trips.reduce((s, t) => s + (t.fuel_cost ?? 0), 0);
  const totalMin = trips.reduce((s, t) => s + (t.duration_min ?? 0), 0);

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📓 Logbook</div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {cars.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🚗</div>
          <div className="empty-state-title">No vehicles</div>
          <div className="empty-state-sub">Add a car to start logging trips.</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
            <select value={selectedCar ?? ''} onChange={(e) => setSelectedCar(Number(e.target.value))} style={{ flex: 1, minWidth: '180px' }}>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>{c.year} {c.make} {c.model}</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={() => setAdding((v) => !v)}>
              {adding ? 'Cancel' : '＋ Log Trip'}
            </button>
          </div>

          {adding && (
            <form onSubmit={handleSubmit}>
              <div className="form-section" style={{ marginBottom: '24px' }}>
                <div className="form-section-title">New Trip</div>
                <div className="form-grid form-grid-3">
                  <div className="form-field">
                    <label>Date *</label>
                    <input type="date" name="date" value={form.date} onChange={set} required />
                  </div>
                  <div className="form-field">
                    <label>Distance (km) *</label>
                    <input type="number" name="distance_km" value={form.distance_km || ''} onChange={set} required min={0} step={0.1} placeholder="e.g. 42.5" />
                  </div>
                  <div className="form-field">
                    <label>Duration (min)</label>
                    <input type="number" name="duration_min" value={form.duration_min ?? ''} onChange={set} min={0} placeholder="e.g. 35" />
                  </div>
                  <div className="form-field">
                    <label>From</label>
                    <input type="text" name="start_location" value={form.start_location ?? ''} onChange={set} placeholder="e.g. Home" />
                  </div>
                  <div className="form-field">
                    <label>To</label>
                    <input type="text" name="end_location" value={form.end_location ?? ''} onChange={set} placeholder="e.g. Office" />
                  </div>
                  <div className="form-field">
                    <label>Purpose</label>
                    <select name="purpose" value={form.purpose ?? ''} onChange={set}>
                      <option value="">— Select —</option>
                      {PURPOSE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Fuel Cost (CAD)</label>
                    <input type="number" name="fuel_cost" value={form.fuel_cost ?? ''} onChange={set} min={0} step={0.01} placeholder="0.00" />
                  </div>
                  <div className="form-field full-width">
                    <label>Notes</label>
                    <textarea name="notes" value={form.notes ?? ''} onChange={set} placeholder="Optional notes…" />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save Trip'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {trips.length > 0 && (
            <div className="cost-row" style={{ marginBottom: '24px' }}>
              <div className="cost-row-item">
                <span className="cost-row-label">Total Distance</span>
                <span className="cost-row-value">{totalKm.toLocaleString('en-CA', { maximumFractionDigits: 1 })} km</span>
              </div>
              {totalMin > 0 && (
                <div className="cost-row-item">
                  <span className="cost-row-label">Total Drive Time</span>
                  <span className="cost-row-value">{fmtDuration(totalMin)}</span>
                </div>
              )}
              {totalCost > 0 && (
                <div className="cost-row-item">
                  <span className="cost-row-label">Total Fuel Cost</span>
                  <span className="cost-row-value">{fmtCurrency(totalCost)}</span>
                </div>
              )}
              <div className="cost-row-item">
                <span className="cost-row-label">Trips Logged</span>
                <span className="cost-row-value">{trips.length}</span>
              </div>
            </div>
          )}

          {trips.length === 0 && !adding ? (
            <div className="empty-state">
              <div className="empty-state-icon">📓</div>
              <div className="empty-state-title">No trips logged</div>
              <div className="empty-state-sub">Start tracking your drives, mileage, and costs.</div>
            </div>
          ) : (
            <div className="timeline">
              {trips.map((t) => (
                <div key={t.id} className="timeline-item">
                  <div className="timeline-left">
                    <div className="timeline-dot" />
                    <div className="timeline-line" />
                  </div>
                  <div className="timeline-content" style={{ cursor: 'default' }}>
                    <div className="timeline-header">
                      <div className="timeline-title">
                        {t.start_location && t.end_location
                          ? `${t.start_location} → ${t.end_location}`
                          : t.start_location || t.end_location || 'Trip'}
                      </div>
                      <div className="timeline-cost">{t.distance_km.toLocaleString('en-CA', { maximumFractionDigits: 1 })} km</div>
                    </div>
                    <div className="timeline-meta">
                      <span>📅 {fmtDate(t.date)}</span>
                      {t.duration_min && <span>⏱ {fmtDuration(t.duration_min)}</span>}
                      {t.purpose && <span>🏷 {t.purpose}</span>}
                      {t.fuel_cost != null && <span>⛽ {fmtCurrency(t.fuel_cost)}</span>}
                      {t.notes && <span>📝 {t.notes}</span>}
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-ghost btn-icon"
                    onClick={() => handleDelete(t.id)}
                    title="Delete"
                    style={{ alignSelf: 'flex-start', marginTop: '12px' }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
