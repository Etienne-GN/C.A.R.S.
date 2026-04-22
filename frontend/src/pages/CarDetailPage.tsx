import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { deleteCar, deleteCarPhoto, getCar, updateCar, uploadCarPhoto } from '../api/cars';
import { createMaintenance, deleteMaintenance, updateMaintenance } from '../api/maintenance';
import { createNote, deleteNote, updateNote } from '../api/notes';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Car } from '../types/car';
import type { ScheduledMaintenance, ScheduledMaintenanceCreate } from '../types/maintenance';
import type { CarNote } from '../types/note';
import type { ServiceRecord } from '../types/service';

type Tab = 'overview' | 'history' | 'schedule' | 'notes';

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtCurrency(n?: number) {
  if (n == null) return '—';
  return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
}

function fmtMileage(n?: number) {
  if (n == null) return '—';
  return n.toLocaleString() + ' km';
}

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="detail-field">
      <div className="detail-label">{label}</div>
      <div className={`detail-value ${!value ? 'empty' : ''}`}>{value ?? 'Not set'}</div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function buildYearlyChart(records: ServiceRecord[]) {
  const byYear: Record<string, number> = {};
  for (const r of records) {
    const y = r.date.slice(0, 4);
    byYear[y] = (byYear[y] ?? 0) + r.total_cost;
  }
  return Object.entries(byYear).sort(([a], [b]) => a.localeCompare(b)).map(([year, total]) => ({ year, total }));
}

function OverviewTab({ car }: { car: Car }) {
  const totalSpent = car.service_records.reduce((s, r) => s + r.total_cost, 0);
  const chartData = buildYearlyChart(car.service_records);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {totalSpent > 0 && (
        <>
          <div className="cost-row">
            <div className="cost-row-item">
              <span className="cost-row-label">Total Maintenance Spent</span>
              <span className="cost-row-value">{fmtCurrency(totalSpent)}</span>
            </div>
            <div className="cost-row-item">
              <span className="cost-row-label">Services Logged</span>
              <span className="cost-row-value">{car.service_records.length}</span>
            </div>
          </div>
          {chartData.length > 1 && (
            <div className="form-section">
              <div className="form-section-title">Yearly Spending</div>
              <div style={{ padding: '20px' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="year" tick={{ fill: 'var(--text-2)', fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${v}`} tick={{ fill: 'var(--text-2)', fontSize: 11 }} width={60} />
                    <Tooltip
                      formatter={(v) => [fmtCurrency(Number(v)), 'Spent']}
                      contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px' }}
                      labelStyle={{ color: 'var(--text-1)' }}
                    />
                    <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      <div className="form-section">
        <div className="form-section-title">Identity</div>
        <div className="detail-grid" style={{ padding: '20px' }}>
          <DetailField label="Make" value={car.make} />
          <DetailField label="Model" value={car.model} />
          <DetailField label="Year" value={car.year} />
          <DetailField label="Trim" value={car.trim} />
          <DetailField label="License Plate" value={car.license_plate} />
          <DetailField label="VIN" value={car.vin} />
          <DetailField label="Color" value={car.color} />
          <DetailField label="Owner" value={car.owner} />
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Specifications</div>
        <div className="detail-grid" style={{ padding: '20px' }}>
          <DetailField label="Engine" value={car.engine} />
          <DetailField label="Transmission" value={car.transmission} />
          <DetailField label="Drivetrain" value={car.drivetrain} />
          <DetailField label="Fuel Type" value={car.fuel_type} />
          <DetailField label="Horsepower" value={car.horsepower ? `${car.horsepower} hp` : null} />
          <DetailField label="Torque" value={car.torque_lbft ? `${car.torque_lbft} lb-ft` : null} />
          <DetailField label="Weight" value={car.weight_kg ? `${car.weight_kg} kg` : null} />
          <DetailField label="0–100 km/h" value={car.zero_to_100_s ? `${car.zero_to_100_s} s` : null} />
          <DetailField label="Top Speed" value={car.top_speed_kmh ? `${car.top_speed_kmh} km/h` : null} />
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Fuel Economy</div>
        <div className="detail-grid" style={{ padding: '20px' }}>
          <DetailField label="City" value={car.fuel_city} />
          <DetailField label="Highway" value={car.fuel_highway} />
          <DetailField label="Tank Capacity" value={car.fuel_tank_l ? `${car.fuel_tank_l} L` : null} />
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Fluids</div>
        <div className="detail-grid" style={{ padding: '20px' }}>
          <DetailField label="Oil Capacity" value={car.oil_capacity_l ? `${car.oil_capacity_l} L` : null} />
          <DetailField label="Oil Type" value={car.oil_type} />
          <DetailField label="Coolant Capacity" value={car.coolant_capacity_l ? `${car.coolant_capacity_l} L` : null} />
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Tires &amp; Brakes</div>
        <div className="detail-grid" style={{ padding: '20px' }}>
          <DetailField label="Summer Tires" value={car.tire_size_summer} />
          <DetailField label="Winter Tires" value={car.tire_size_winter} />
          <DetailField label="Front Disk" value={car.front_disk_mm ? `${car.front_disk_mm} mm` : null} />
          <DetailField label="Rear Disk" value={car.rear_disk_mm ? `${car.rear_disk_mm} mm` : null} />
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Purchase Info</div>
        <div className="detail-grid" style={{ padding: '20px' }}>
          <DetailField label="Purchase Date" value={fmtDate(car.purchase_date)} />
          <DetailField label="Purchase Price" value={fmtCurrency(car.purchase_price)} />
          <DetailField label="Mileage at Purchase" value={fmtMileage(car.purchase_mileage)} />
          <DetailField label="Current Mileage" value={fmtMileage(car.current_mileage)} />
        </div>
      </div>

      {car.notes && (
        <div className="form-section">
          <div className="form-section-title">Notes</div>
          <div style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
            {car.notes}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Service History Tab ───────────────────────────────────────────────────────

function HistoryTab({ car, records }: { car: Car; records: ServiceRecord[] }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <Link to={`/cars/${car.id}/services/new`} className="btn btn-primary">＋ Log Service</Link>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔧</div>
          <div className="empty-state-title">No service records yet</div>
          <div className="empty-state-sub">Start logging maintenance to track your car's history.</div>
          <Link to={`/cars/${car.id}/services/new`} className="btn btn-primary">Log First Service</Link>
        </div>
      ) : (
        <div className="timeline">
          {records.map((r) => (
            <div key={r.id} className="timeline-item">
              <div className="timeline-left">
                <div className="timeline-dot" />
                <div className="timeline-line" />
              </div>
              <Link to={`/cars/${car.id}/services/${r.id}`} className="timeline-content">
                <div className="timeline-header">
                  <div className="timeline-title">{r.title}</div>
                  <div className="timeline-cost">{fmtCurrency(r.total_cost)}</div>
                </div>
                <div className="timeline-meta">
                  <span>📅 {fmtDate(r.date)}</span>
                  {r.mileage_at_service && <span>🛣 {fmtMileage(r.mileage_at_service)}</span>}
                  {r.shop_name && <span>🏪 {r.shop_name}</span>}
                  {r.parts.length > 0 && <span>🔩 {r.parts.length} part{r.parts.length !== 1 ? 's' : ''}</span>}
                  {r.attachments.length > 0 && <span>📎 {r.attachments.length} file{r.attachments.length !== 1 ? 's' : ''}</span>}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Schedule Tab ──────────────────────────────────────────────────────────────

const EMPTY_TASK: ScheduledMaintenanceCreate = {
  title: '', description: '', due_date: '', due_mileage: undefined, interval_months: undefined, interval_km: undefined,
};

function getStatus(item: ScheduledMaintenance, currentMileage?: number) {
  if (item.is_completed) return 'done';
  const today = new Date();
  if (item.due_date) {
    const due = new Date(item.due_date + 'T00:00:00');
    const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (days < 0) return 'overdue';
    if (days <= 30) return 'due-soon';
  }
  if (item.due_mileage && currentMileage) {
    const km = item.due_mileage - currentMileage;
    if (km < 0) return 'overdue';
    if (km <= 1000) return 'due-soon';
  }
  return 'ok';
}

function ScheduleTab({ car, items, onRefresh }: { car: Car; items: ScheduledMaintenance[]; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ScheduledMaintenanceCreate>(EMPTY_TASK);
  const [submitting, setSubmitting] = useState(false);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value,
    }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== '' && v !== undefined)
    ) as ScheduledMaintenanceCreate;
    await createMaintenance(car.id, payload);
    setForm(EMPTY_TASK);
    setAdding(false);
    setSubmitting(false);
    onRefresh();
  };

  const toggle = async (item: ScheduledMaintenance) => {
    await updateMaintenance(item.id, { is_completed: !item.is_completed });
    onRefresh();
  };

  const remove = async (id: number) => {
    await deleteMaintenance(id);
    onRefresh();
  };

  const statusBadge = (s: string) => {
    if (s === 'overdue') return <span className="badge badge-overdue">Overdue</span>;
    if (s === 'due-soon') return <span className="badge badge-due-soon">Due Soon</span>;
    if (s === 'done') return <span className="badge badge-done">Done</span>;
    return null;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : '＋ Add Task'}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd}>
          <div className="form-section" style={{ marginBottom: '20px' }}>
            <div className="form-section-title">New Scheduled Task</div>
            <div className="form-grid">
              <div className="form-field full-width">
                <label>Title *</label>
                <input type="text" name="title" value={form.title} onChange={set} required placeholder="e.g. Oil Change" />
              </div>
              <div className="form-field full-width">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={set} placeholder="Optional details..." />
              </div>
              <div className="form-field">
                <label>Due Date</label>
                <input type="date" name="due_date" value={form.due_date ?? ''} onChange={set} />
              </div>
              <div className="form-field">
                <label>Due Mileage (km)</label>
                <input type="number" name="due_mileage" value={form.due_mileage ?? ''} onChange={set} min={0} />
              </div>
              <div className="form-field">
                <label>Repeat Every (months)</label>
                <input type="number" name="interval_months" value={form.interval_months ?? ''} onChange={set} min={1} />
              </div>
              <div className="form-field">
                <label>Repeat Every (km)</label>
                <input type="number" name="interval_km" value={form.interval_km ?? ''} onChange={set} min={1} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Add Task'}
              </button>
            </div>
          </div>
        </form>
      )}

      {items.length === 0 && !adding ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">No scheduled tasks</div>
          <div className="empty-state-sub">Add maintenance reminders to stay on top of your car's needs.</div>
        </div>
      ) : (
        items.map((item) => {
          const status = getStatus(item, car.current_mileage);
          return (
            <div key={item.id} className={`maintenance-item ${item.is_completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={item.is_completed}
                onChange={() => toggle(item)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', flexShrink: 0 }}
              />
              <div className="maintenance-item-info">
                <div className="maintenance-item-title">{item.title}</div>
                <div className="maintenance-item-meta">
                  {item.due_date && <span>📅 {fmtDate(item.due_date)} </span>}
                  {item.due_mileage && <span> · 🛣 {fmtMileage(item.due_mileage)}</span>}
                  {item.interval_months && <span> · ↻ every {item.interval_months} mo</span>}
                  {item.interval_km && <span> · ↻ every {item.interval_km.toLocaleString()} km</span>}
                  {item.description && <span> · {item.description}</span>}
                </div>
              </div>
              {statusBadge(status)}
              <button className="btn btn-sm btn-ghost btn-icon" onClick={() => remove(item.id)} title="Delete">✕</button>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────

function NotesTab({ car, notes, onRefresh }: { car: Car; notes: CarNote[]; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', body: '' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await createNote(car.id, { title: form.title, body: form.body || undefined });
    setForm({ title: '', body: '' });
    setAdding(false);
    setSubmitting(false);
    onRefresh();
  };

  const startEdit = (note: CarNote) => {
    setEditing(note.id);
    setEditForm({ title: note.title, body: note.body ?? '' });
    setExpanded(note.id);
  };

  const handleEdit = async (e: React.FormEvent, noteId: number) => {
    e.preventDefault();
    await updateNote(noteId, { title: editForm.title, body: editForm.body || undefined });
    setEditing(null);
    onRefresh();
  };

  const handleDelete = async (noteId: number) => {
    await deleteNote(noteId);
    if (expanded === noteId) setExpanded(null);
    onRefresh();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : '＋ Add Note'}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd}>
          <div className="form-section" style={{ marginBottom: '20px' }}>
            <div className="form-section-title">New Note</div>
            <div className="form-grid">
              <div className="form-field full-width">
                <label>Title *</label>
                <input
                  type="text" value={form.title} required
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Brake squeak at low speed"
                />
              </div>
              <div className="form-field full-width">
                <label>Body</label>
                <textarea
                  value={form.body} rows={4}
                  onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                  placeholder="Details, observations, links…"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </div>
        </form>
      )}

      {notes.length === 0 && !adding ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">No notes yet</div>
          <div className="empty-state-sub">Jot down observations, quirks, or reference info for this vehicle.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notes.map((note) => (
            <div key={note.id} className="form-section" style={{ marginBottom: 0 }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 20px', cursor: 'pointer', userSelect: 'none',
                }}
                onClick={() => setExpanded(expanded === note.id ? null : note.id)}
              >
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{expanded === note.id ? '▾' : '▸'}</span>
                <span style={{ flex: 1, fontWeight: 500, fontSize: '14px' }}>{note.title}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-2)', flexShrink: 0 }}>
                  {new Date(note.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ fontSize: '11px', padding: '2px 8px', flexShrink: 0 }}
                  onClick={(e) => { e.stopPropagation(); startEdit(note); }}
                >Edit</button>
                <button
                  className="btn btn-sm btn-ghost btn-icon"
                  onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                  title="Delete"
                >✕</button>
              </div>

              {expanded === note.id && (
                <div style={{ padding: '0 20px 16px' }}>
                  {editing === note.id ? (
                    <form onSubmit={(e) => handleEdit(e, note.id)}>
                      <div className="form-field" style={{ marginBottom: '8px' }}>
                        <label>Title *</label>
                        <input
                          type="text" value={editForm.title} required
                          onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                        />
                      </div>
                      <div className="form-field" style={{ marginBottom: '8px' }}>
                        <label>Body</label>
                        <textarea
                          value={editForm.body} rows={5}
                          onChange={(e) => setEditForm((p) => ({ ...p, body: e.target.value }))}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-sm">Save</button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ fontSize: '14px', color: 'var(--text-2)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {note.body || <span style={{ fontStyle: 'italic' }}>No body.</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CarDetailPage() {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const refreshRef = useRef(0);

  const load = () => {
    if (!carId) return;
    getCar(Number(carId))
      .then(setCar)
      .catch(() => setError('Car not found.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [carId, refreshRef.current]);

  const handleDelete = async () => {
    await deleteCar(Number(carId));
    navigate('/');
  };

  const handleArchiveToggle = async () => {
    if (!car) return;
    setArchiving(true);
    await updateCar(car.id, { is_archived: !car.is_archived });
    await load();
    setArchiving(false);
  };

  const handlePhotoUpload = async (file: File) => {
    if (!car) return;
    setPhotoUploading(true);
    try {
      const updated = await uploadCarPhoto(car.id, file);
      setCar(updated);
    } catch {
      setError('Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!car) return;
    const updated = await deleteCarPhoto(car.id);
    setCar(updated);
  };

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;
  if (error || !car) return (
    <div>
      <div className="error-msg">{error ?? 'Car not found.'}</div>
      <Link to="/" className="back-link">← Back to Garage</Link>
    </div>
  );

  return (
    <div>
      {confirmDelete && (
        <ConfirmDialog
          message={`Delete ${car.year} ${car.make} ${car.model}? This will also delete all service records and scheduled maintenance.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          confirmLabel="Delete"
          danger
        />
      )}

      <Link to="/" className="back-link">← Garage</Link>

      <div className="page-header">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div
            onClick={() => photoRef.current?.click()}
            title={car.photo_filename ? 'Change photo' : 'Add photo'}
            style={{
              width: '64px', height: '64px', borderRadius: '8px', flexShrink: 0, cursor: 'pointer',
              background: 'var(--surface-2)', border: '2px dashed var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative',
            }}
          >
            {car.photo_filename
              ? <img src={`/uploads/${car.photo_filename}`} alt="car" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : photoUploading ? <span className="spinner" /> : <span style={{ fontSize: '22px' }}>📷</span>
            }
          </div>
          <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} />
          <div>
            <div className="page-title" style={car.is_archived ? { opacity: 0.6 } : undefined}>
              {car.year} {car.make} {car.model}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
              <span className="badge badge-plate">{car.license_plate}</span>
              {car.trim && <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{car.trim}</span>}
              {car.is_archived && <span className="badge" style={{ background: '#3a3a3a', color: '#888' }}>Archived</span>}
              {car.photo_filename && (
                <button className="btn btn-sm btn-ghost" style={{ fontSize: '11px', padding: '2px 6px' }} onClick={handlePhotoDelete}>Remove photo</button>
              )}
            </div>
          </div>
        </div>
        <div className="page-header-actions">
          <Link to={`/cars/${car.id}/edit`} className="btn btn-secondary">Edit</Link>
          <button className="btn btn-secondary" onClick={handleArchiveToggle} disabled={archiving}>
            {car.is_archived ? 'Unarchive' : 'Archive'}
          </button>
          <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          Service History {car.service_records.length > 0 && `(${car.service_records.length})`}
        </button>
        <button className={`tab ${tab === 'schedule' ? 'active' : ''}`} onClick={() => setTab('schedule')}>
          Schedule {car.scheduled_maintenance.length > 0 && `(${car.scheduled_maintenance.filter(m => !m.is_completed).length})`}
        </button>
        <button className={`tab ${tab === 'notes' ? 'active' : ''}`} onClick={() => setTab('notes')}>
          Notes {car.car_notes.length > 0 && `(${car.car_notes.length})`}
        </button>
      </div>

      {tab === 'overview' && <OverviewTab car={car} />}
      {tab === 'history' && <HistoryTab car={car} records={car.service_records} />}
      {tab === 'schedule' && (
        <ScheduleTab
          car={car}
          items={car.scheduled_maintenance}
          onRefresh={load}
        />
      )}
      {tab === 'notes' && (
        <NotesTab
          car={car}
          notes={car.car_notes}
          onRefresh={load}
        />
      )}
    </div>
  );
}
