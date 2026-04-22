import { type FormEvent, useEffect, useState } from 'react';
import { getCars } from '../api/cars';
import { addTreadReading, createTireSet, deleteTireSet, getTireSets } from '../api/tires';
import type { CarSummary } from '../types/car';
import type { TireSet, TireSetCreate, TreadReadingCreate } from '../types/tires';

const SEASONS = ['Summer', 'Winter', 'All-Season'];

function treadColor(mm?: number): string {
  if (mm == null) return 'var(--text-3)';
  if (mm <= 2) return 'var(--danger)';
  if (mm <= 4) return 'var(--warning)';
  return 'var(--success)';
}

function TreadCell({ label, value }: { label: string; value?: number }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px', background: 'var(--surface-3)', borderRadius: '6px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '15px', color: treadColor(value) }}>
        {value != null ? `${value}mm` : '—'}
      </div>
    </div>
  );
}

const EMPTY_SET: TireSetCreate = { name: '', brand: '', model: '', size: '', season: 'Summer', installed_date: '', installed_odometer: undefined, notes: '' };
const EMPTY_READING: TreadReadingCreate = { date: new Date().toISOString().slice(0, 10), fl: undefined, fr: undefined, rl: undefined, rr: undefined };

export default function TirePage() {
  const [cars, setCars] = useState<CarSummary[]>([]);
  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  const [sets, setSets] = useState<TireSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSet, setAddingSet] = useState(false);
  const [readingFor, setReadingFor] = useState<number | null>(null);
  const [setForm, setSetForm] = useState<TireSetCreate>(EMPTY_SET);
  const [readingForm, setReadingForm] = useState<TreadReadingCreate>(EMPTY_READING);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCars().then((c) => {
      const active = c.filter((x) => !x.is_archived);
      setCars(active);
      if (active.length > 0) setSelectedCar(active[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const reload = async () => {
    if (!selectedCar) return;
    setSets(await getTireSets(selectedCar));
  };

  useEffect(() => { reload(); }, [selectedCar]);

  const handleAddSet = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;
    setSubmitting(true);
    try {
      const payload: TireSetCreate = {
        name: setForm.name,
        brand: setForm.brand || undefined,
        model: setForm.model || undefined,
        size: setForm.size || undefined,
        season: setForm.season || undefined,
        installed_date: setForm.installed_date || undefined,
        installed_odometer: setForm.installed_odometer,
        notes: setForm.notes || undefined,
      };
      await createTireSet(selectedCar, payload);
      await reload();
      setAddingSet(false);
      setSetForm(EMPTY_SET);
    } catch { setError('Failed to save.'); }
    finally { setSubmitting(false); }
  };

  const handleAddReading = async (e: FormEvent) => {
    e.preventDefault();
    if (!readingFor) return;
    setSubmitting(true);
    try {
      await addTreadReading(readingFor, readingForm);
      await reload();
      setReadingFor(null);
      setReadingForm(EMPTY_READING);
    } catch { setError('Failed to save reading.'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteSet = async (id: number) => {
    await deleteTireSet(id);
    await reload();
  };

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Tire Tracker</div>
          <div className="page-subtitle">Track tire sets and tread depth over time</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={selectedCar ?? ''} onChange={(e) => setSelectedCar(Number(e.target.value))}>
            {cars.map((c) => <option key={c.id} value={c.id}>{c.year} {c.make} {c.model}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setAddingSet((v) => !v)}>
            {addingSet ? 'Cancel' : '＋ Add Tire Set'}
          </button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {addingSet && (
        <form onSubmit={handleAddSet}>
          <div className="form-section" style={{ marginBottom: '24px' }}>
            <div className="form-section-title">New Tire Set</div>
            <div className="form-grid form-grid-3" style={{ padding: '20px' }}>
              <div className="form-field">
                <label>Name *</label>
                <input type="text" value={setForm.name} onChange={(e) => setSetForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Winter 2023" required />
              </div>
              <div className="form-field">
                <label>Brand</label>
                <input type="text" value={setForm.brand ?? ''} onChange={(e) => setSetForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Michelin" />
              </div>
              <div className="form-field">
                <label>Model</label>
                <input type="text" value={setForm.model ?? ''} onChange={(e) => setSetForm(f => ({ ...f, model: e.target.value }))} placeholder="e.g. X-Ice Snow" />
              </div>
              <div className="form-field">
                <label>Size</label>
                <input type="text" value={setForm.size ?? ''} onChange={(e) => setSetForm(f => ({ ...f, size: e.target.value }))} placeholder="e.g. 205/55R16" />
              </div>
              <div className="form-field">
                <label>Season</label>
                <select value={setForm.season ?? ''} onChange={(e) => setSetForm(f => ({ ...f, season: e.target.value }))}>
                  {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Installed Date</label>
                <input type="date" value={setForm.installed_date ?? ''} onChange={(e) => setSetForm(f => ({ ...f, installed_date: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>Installed Odometer (km)</label>
                <input type="number" value={setForm.installed_odometer ?? ''} onChange={(e) => setSetForm(f => ({ ...f, installed_odometer: Number(e.target.value) || undefined }))} min={0} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setAddingSet(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Add Set'}</button>
            </div>
          </div>
        </form>
      )}

      {readingFor !== null && (
        <form onSubmit={handleAddReading}>
          <div className="form-section" style={{ marginBottom: '24px' }}>
            <div className="form-section-title">Add Tread Reading (mm)</div>
            <div className="form-grid form-grid-3" style={{ padding: '20px' }}>
              <div className="form-field">
                <label>Date *</label>
                <input type="date" value={readingForm.date} onChange={(e) => setReadingForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="form-field">
                <label>Odometer (km)</label>
                <input type="number" value={readingForm.odometer ?? ''} onChange={(e) => setReadingForm(f => ({ ...f, odometer: Number(e.target.value) || undefined }))} min={0} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {(['fl', 'fr', 'rl', 'rr'] as const).map((pos) => (
                  <div className="form-field" key={pos}>
                    <label>{pos.toUpperCase()} (mm)</label>
                    <input type="number" value={readingForm[pos] ?? ''} onChange={(e) => setReadingForm(f => ({ ...f, [pos]: Number(e.target.value) || undefined }))} min={0} max={20} step={0.5} placeholder="0–20" />
                  </div>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setReadingFor(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Reading'}</button>
            </div>
          </div>
        </form>
      )}

      {sets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔄</div>
          <div className="empty-state-title">No tire sets yet</div>
          <div className="empty-state-sub">Add a tire set to start tracking tread depth and seasons.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sets.map((ts) => (
            <div key={ts.id} className="form-section" style={{ marginBottom: 0 }}>
              <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span>{ts.name}</span>
                  {ts.season && <span className="badge badge-plate" style={{ fontSize: '11px' }}>{ts.season}</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => setReadingFor(readingFor === ts.id ? null : ts.id)}>
                    + Tread Reading
                  </button>
                  <button className="btn btn-sm btn-ghost btn-icon" onClick={() => handleDeleteSet(ts.id)} title="Delete">✕</button>
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-2)', marginBottom: ts.latest_tread ? '16px' : '0' }}>
                  {ts.brand && <span>{ts.brand}</span>}
                  {ts.model && <span>· {ts.model}</span>}
                  {ts.size && <span>· {ts.size}</span>}
                  {ts.installed_date && <span>· Installed {ts.installed_date}</span>}
                  {ts.installed_odometer && <span>· @ {ts.installed_odometer.toLocaleString()} km</span>}
                </div>
                {ts.latest_tread && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Latest tread — {ts.latest_tread.date} · {ts.readings_count} reading{ts.readings_count !== 1 ? 's' : ''}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxWidth: '320px' }}>
                      <TreadCell label="FL" value={ts.latest_tread.fl} />
                      <TreadCell label="FR" value={ts.latest_tread.fr} />
                      <TreadCell label="RL" value={ts.latest_tread.rl} />
                      <TreadCell label="RR" value={ts.latest_tread.rr} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '8px' }}>
                      🟢 Good (&gt;4mm) · 🟡 Watch (2–4mm) · 🔴 Replace (&lt;2mm)
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
