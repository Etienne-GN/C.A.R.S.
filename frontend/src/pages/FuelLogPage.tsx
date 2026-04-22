import { type FormEvent, useEffect, useState } from 'react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getCars } from '../api/cars';
import { createFuelLog, deleteFuelLog, getFuelLogs } from '../api/fuel';
import type { CarSummary } from '../types/car';
import type { FuelLogCreate, FuelLogEntry } from '../types/fuel';

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

const EMPTY: FuelLogCreate = {
  date: new Date().toISOString().slice(0, 10),
  odometer: 0,
  litres: 0,
  price_per_litre: 0,
  station: '',
  full_tank: true,
};

export default function FuelLogPage() {
  const [cars, setCars] = useState<CarSummary[]>([]);
  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  const [entries, setEntries] = useState<FuelLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<FuelLogCreate>(EMPTY);
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
    setEntries([]);
    getFuelLogs(selectedCar).then(setEntries).catch(() => setError('Failed to load fuel logs.'));
  }, [selectedCar]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;
    setSubmitting(true);
    try {
      await createFuelLog(selectedCar, { ...form, station: form.station || undefined });
      const updated = await getFuelLogs(selectedCar);
      setEntries(updated);
      setAdding(false);
      setForm(EMPTY);
    } catch {
      setError('Failed to save entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteFuelLog(id);
    if (selectedCar) setEntries(await getFuelLogs(selectedCar));
  };

  const chartData = [...entries].reverse().map((e) => ({
    date: e.date,
    l100: e.l_per_100km ?? null,
    cost: e.total_cost,
  })).filter((e) => e.l100 !== null);

  const avgL100 = entries.filter(e => e.l_per_100km).length > 0
    ? (entries.reduce((s, e) => s + (e.l_per_100km ?? 0), 0) / entries.filter(e => e.l_per_100km).length).toFixed(1)
    : null;
  const totalFuel = entries.reduce((s, e) => s + e.total_cost, 0);

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Fuel Log</div>
          <div className="page-subtitle">Track fill-ups and fuel efficiency</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={selectedCar ?? ''} onChange={(e) => setSelectedCar(Number(e.target.value))}>
            {cars.map((c) => <option key={c.id} value={c.id}>{c.year} {c.make} {c.model}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setAdding((v) => !v)}>
            {adding ? 'Cancel' : '＋ Add Fill-up'}
          </button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Stats */}
      {entries.length > 0 && (
        <div className="cost-row" style={{ marginBottom: '24px' }}>
          {avgL100 && (
            <div className="cost-row-item">
              <span className="cost-row-label">Avg Consumption</span>
              <span className="cost-row-value">{avgL100} L/100km</span>
            </div>
          )}
          <div className="cost-row-item">
            <span className="cost-row-label">Total Fuel Cost</span>
            <span className="cost-row-value">{totalFuel.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}</span>
          </div>
          <div className="cost-row-item">
            <span className="cost-row-label">Fill-ups Logged</span>
            <span className="cost-row-value">{entries.length}</span>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="form-section" style={{ marginBottom: '24px' }}>
          <div className="form-section-title">L/100km Over Time</div>
          <div style={{ padding: '20px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-2)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-2)', fontSize: 11 }} unit=" L" width={50} />
                <Tooltip
                  formatter={(v: number) => [`${v} L/100km`, 'Consumption']}
                  contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px' }}
                  labelStyle={{ color: 'var(--text-1)' }}
                />
                <Line type="monotone" dataKey="l100" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <form onSubmit={handleSubmit}>
          <div className="form-section" style={{ marginBottom: '24px' }}>
            <div className="form-section-title">New Fill-up</div>
            <div className="form-grid form-grid-3" style={{ padding: '20px' }}>
              <div className="form-field">
                <label>Date *</label>
                <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="form-field">
                <label>Odometer (km) *</label>
                <input type="number" value={form.odometer || ''} onChange={(e) => setForm(f => ({ ...f, odometer: Number(e.target.value) }))} min={0} required />
              </div>
              <div className="form-field">
                <label>Litres *</label>
                <input type="number" value={form.litres || ''} onChange={(e) => setForm(f => ({ ...f, litres: Number(e.target.value) }))} min={0} step={0.01} required />
              </div>
              <div className="form-field">
                <label>Price / Litre (CAD) *</label>
                <input type="number" value={form.price_per_litre || ''} onChange={(e) => setForm(f => ({ ...f, price_per_litre: Number(e.target.value) }))} min={0} step={0.001} required />
              </div>
              <div className="form-field">
                <label>Station</label>
                <input type="text" value={form.station ?? ''} onChange={(e) => setForm(f => ({ ...f, station: e.target.value }))} placeholder="e.g. Costco, Esso" />
              </div>
              <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
                <input type="checkbox" id="full_tank" checked={form.full_tank} onChange={(e) => setForm(f => ({ ...f, full_tank: e.target.checked }))} />
                <label htmlFor="full_tank" style={{ marginBottom: 0 }}>Full tank</label>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Fill-up'}</button>
            </div>
          </div>
        </form>
      )}

      {/* Table */}
      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⛽</div>
          <div className="empty-state-title">No fill-ups yet</div>
          <div className="empty-state-sub">Log your first fill-up to start tracking fuel efficiency.</div>
        </div>
      ) : (
        <div className="form-section">
          <div className="form-section-title">Fill-up History</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="parts-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Odometer</th>
                  <th>Litres</th>
                  <th>¢/L</th>
                  <th>Total</th>
                  <th>L/100km</th>
                  <th>Station</th>
                  <th style={{ width: '32px' }}></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>{fmtDate(e.date)}</td>
                    <td>{e.odometer.toLocaleString()} km</td>
                    <td>{e.litres.toFixed(2)} L</td>
                    <td>{(e.price_per_litre * 100).toFixed(1)}¢</td>
                    <td style={{ fontWeight: 600 }}>{e.total_cost.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}</td>
                    <td style={{ color: e.l_per_100km ? 'var(--accent)' : 'var(--text-3)' }}>
                      {e.l_per_100km ? `${e.l_per_100km} L` : e.full_tank ? '—' : 'partial'}
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{e.station || '—'}</td>
                    <td>
                      <button className="btn btn-sm btn-ghost btn-icon" onClick={() => handleDelete(e.id)} title="Delete">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
