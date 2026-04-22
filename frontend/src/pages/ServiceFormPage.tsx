import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCar } from '../api/cars';
import { createService, getService, updateService } from '../api/services';
import type { CarSummary } from '../types/car';
import type { PartCreate, ServiceRecordCreate } from '../types/service';

const EMPTY_PART: PartCreate = { name: '', brand: '', part_number: '', quantity: 1, unit_cost: 0, supplier: '', notes: '' };

function newPart(): PartCreate & { _key: number } {
  return { ...EMPTY_PART, _key: Date.now() + Math.random() };
}

type PartRow = PartCreate & { _key: number };

export default function ServiceFormPage() {
  const { carId, serviceId } = useParams<{ carId: string; serviceId: string }>();
  const isEdit = Boolean(serviceId);
  const navigate = useNavigate();

  const [car, setCar] = useState<Pick<CarSummary, 'id' | 'make' | 'model' | 'year'> | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState('');
  const [shop, setShop] = useState('');
  const [laborCost, setLaborCost] = useState('0');
  const [laborHours, setLaborHours] = useState('0');
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState<PartRow[]>([newPart()]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const carPromise = getCar(Number(carId), ctrl.signal).then((c) => setCar(c));
    const servicePromise = isEdit && serviceId
      ? getService(Number(serviceId), ctrl.signal).then((s) => {
          setTitle(s.title);
          setDate(s.date);
          setMileage(s.mileage_at_service?.toString() ?? '');
          setShop(s.shop_name ?? '');
          setLaborCost(s.labor_cost.toString());
          setLaborHours(s.labor_hours.toString());
          setNotes(s.notes ?? '');
          if (s.parts.length > 0) {
            setParts(s.parts.map((p) => ({ ...p, _key: p.id })));
          }
        })
      : Promise.resolve();

    Promise.all([carPromise, servicePromise])
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [carId, serviceId, isEdit]);

  const updatePart = (key: number, field: keyof PartCreate, value: string | number) => {
    setParts((prev) => prev.map((p) => p._key === key ? { ...p, [field]: value } : p));
  };

  const removePart = (key: number) => {
    setParts((prev) => prev.filter((p) => p._key !== key));
  };

  const partsTotal = parts.reduce((s, p) => s + (Number(p.quantity) || 1) * (Number(p.unit_cost) || 0), 0);
  const total = (Number(laborCost) || 0) + partsTotal;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const cleanParts = parts
      .filter((p) => p.name.trim())
      .map(({ _key, ...p }) => ({
        ...p,
        part_number: p.part_number || undefined,
        brand: p.brand || undefined,
        supplier: p.supplier || undefined,
        notes: p.notes || undefined,
      }));

    const payload: ServiceRecordCreate = {
      title,
      date,
      mileage_at_service: mileage ? Number(mileage) : undefined,
      shop_name: shop || undefined,
      labor_cost: Number(laborCost) || 0,
      labor_hours: Number(laborHours) || 0,
      notes: notes || undefined,
      parts: cleanParts,
    };

    try {
      if (isEdit && serviceId) {
        await updateService(Number(serviceId), payload);
        navigate(`/cars/${carId}/services/${serviceId}`);
      } else {
        const record = await createService(Number(carId), payload);
        navigate(`/cars/${carId}/services/${record.id}`);
      }
    } catch {
      setError('Failed to save service record.');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;

  return (
    <div>
      <Link to={`/cars/${carId}`} className="back-link">← {car ? `${car.year} ${car.make} ${car.model}` : 'Car'}</Link>

      <div className="page-header">
        <div className="page-title">{isEdit ? 'Edit Service Record' : 'Log Service'}</div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title">Service Details</div>
          <div className="form-grid form-grid-3">
            <div className="form-field full-width">
              <label>Title *</label>
              <input type="text" value={title} onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} required placeholder="e.g. Oil Change, Brake Pad Replacement" />
            </div>
            <div className="form-field">
              <label>Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Mileage at Service (km)</label>
              <input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} min={0} placeholder="Optional" />
            </div>
            <div className="form-field">
              <label>Shop / Location</label>
              <input type="text" value={shop} onChange={(e) => setShop(e.target.value)} placeholder="e.g. Garage Dupont, DIY" />
            </div>
            <div className="form-field">
              <label>Labour Cost (CAD)</label>
              <input type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} min={0} step={0.01} />
            </div>
            <div className="form-field">
              <label>Work Hours</label>
              <input type="number" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} min={0} step={0.25} placeholder="0.0" />
            </div>
            <div className="form-field full-width">
              <label>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was done, observations, etc." />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Parts &amp; Materials</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setParts((p) => [...p, newPart()])}>+ Add Part</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="parts-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '160px' }}>Part Name</th>
                  <th style={{ minWidth: '100px' }}>Brand</th>
                  <th style={{ minWidth: '110px' }}>Part #</th>
                  <th style={{ width: '80px' }}>Qty</th>
                  <th style={{ width: '100px' }}>Unit Cost</th>
                  <th style={{ minWidth: '140px' }}>Supplier</th>
                  <th style={{ width: '32px' }}></th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p._key}>
                    <td><input type="text" value={p.name} onChange={(e) => updatePart(p._key, 'name', e.target.value)} placeholder="e.g. Oil Filter" /></td>
                    <td><input type="text" value={p.brand ?? ''} onChange={(e) => updatePart(p._key, 'brand', e.target.value)} placeholder="Brand" /></td>
                    <td><input type="text" value={p.part_number ?? ''} onChange={(e) => updatePart(p._key, 'part_number', e.target.value)} placeholder="Part #" /></td>
                    <td><input type="number" value={p.quantity} onChange={(e) => updatePart(p._key, 'quantity', Number(e.target.value))} min={1} style={{ width: '70px' }} /></td>
                    <td><input type="number" value={p.unit_cost} onChange={(e) => updatePart(p._key, 'unit_cost', Number(e.target.value))} min={0} step={0.01} /></td>
                    <td><input type="text" value={p.supplier ?? ''} onChange={(e) => updatePart(p._key, 'supplier', e.target.value)} placeholder="e.g. RockAuto" /></td>
                    <td>
                      <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => removePart(p._key)} title="Remove">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cost-row" style={{ margin: '0', borderRadius: '0', borderTop: '1px solid var(--border)' }}>
            <div className="cost-row-item">
              <span className="cost-row-label">Labour</span>
              <span className="cost-row-value" style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                {(Number(laborCost) || 0).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}
              </span>
            </div>
            <div className="cost-row-item">
              <span className="cost-row-label">Parts</span>
              <span className="cost-row-value" style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                {partsTotal.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}
              </span>
            </div>
            <div className="cost-row-item">
              <span className="cost-row-label">Total</span>
              <span className="cost-row-value">
                {total.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}
              </span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Link to={`/cars/${carId}`} className="btn btn-ghost">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Log Service'}
          </button>
        </div>
      </form>
    </div>
  );
}
