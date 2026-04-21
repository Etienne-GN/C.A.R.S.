import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createCar, getCar, updateCar } from '../api/cars';
import type { CarCreate } from '../types/car';

const EMPTY: CarCreate = {
  make: '', model: '', year: new Date().getFullYear(),
  vin: '', license_plate: '',
  color: '', owner: '',
  trim: '', engine: '', transmission: '', drivetrain: '', fuel_type: '',
  purchase_date: '', purchase_price: undefined, purchase_mileage: undefined,
  current_mileage: undefined, notes: '',
};

const DRIVETRAIN_OPTIONS = ['FWD', 'RWD', 'AWD', '4WD'];
const FUEL_OPTIONS = ['Gasoline', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric', 'Natural Gas'];

export default function CarFormPage() {
  const { carId } = useParams<{ carId: string }>();
  const isEdit = Boolean(carId);
  const navigate = useNavigate();
  const [form, setForm] = useState<CarCreate>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carId) return;
    const ctrl = new AbortController();
    getCar(Number(carId), ctrl.signal)
      .then((car) => {
        setForm({
          make: car.make, model: car.model, year: car.year,
          vin: car.vin, license_plate: car.license_plate,
          color: car.color ?? '', owner: car.owner ?? '',
          trim: car.trim ?? '', engine: car.engine ?? '',
          transmission: car.transmission ?? '',
          drivetrain: car.drivetrain ?? '',
          fuel_type: car.fuel_type ?? '',
          purchase_date: car.purchase_date ?? '',
          purchase_price: car.purchase_price,
          purchase_mileage: car.purchase_mileage,
          current_mileage: car.current_mileage,
          notes: car.notes ?? '',
        });
        setLoading(false);
      })
      .catch(() => { setError('Failed to load car.'); setLoading(false); });
    return () => ctrl.abort();
  }, [carId]);

  const set = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number'
        ? (value === '' ? undefined : Number(value))
        : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== '' && v !== undefined)
    ) as CarCreate;

    try {
      if (isEdit) {
        await updateCar(Number(carId), payload);
        navigate(`/cars/${carId}`);
      } else {
        const car = await createCar(payload);
        navigate(`/cars/${car.id}`);
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 409 ? 'A car with this VIN or license plate already exists.' : 'Failed to save car.');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;

  return (
    <div>
      <Link to={isEdit ? `/cars/${carId}` : '/'} className="back-link">← Back</Link>
      <div className="page-header">
        <div className="page-title">{isEdit ? 'Edit Car' : 'Add New Car'}</div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title">Identity</div>
          <div className="form-grid form-grid-3">
            <div className="form-field">
              <label>Make *</label>
              <input type="text" name="make" value={form.make} onChange={set} required placeholder="e.g. Volkswagen" />
            </div>
            <div className="form-field">
              <label>Model *</label>
              <input type="text" name="model" value={form.model} onChange={set} required placeholder="e.g. Jetta" />
            </div>
            <div className="form-field">
              <label>Year *</label>
              <input type="number" name="year" value={form.year} onChange={set} required min={1886} max={2100} />
            </div>
            <div className="form-field">
              <label>VIN *</label>
              <input type="text" name="vin" value={form.vin} onChange={set} required maxLength={17} placeholder="17-character VIN" style={{ fontFamily: 'monospace' }} />
            </div>
            <div className="form-field">
              <label>License Plate *</label>
              <input type="text" name="license_plate" value={form.license_plate} onChange={set} required maxLength={20} style={{ fontFamily: 'monospace' }} />
            </div>
            <div className="form-field">
              <label>Color</label>
              <input type="text" name="color" value={form.color} onChange={set} placeholder="e.g. Silver" />
            </div>
            <div className="form-field">
              <label>Owner</label>
              <input type="text" name="owner" value={form.owner} onChange={set} placeholder="Owner name" />
            </div>
            <div className="form-field">
              <label>Trim</label>
              <input type="text" name="trim" value={form.trim} onChange={set} placeholder="e.g. Highline" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Specifications</div>
          <div className="form-grid form-grid-3">
            <div className="form-field">
              <label>Engine</label>
              <input type="text" name="engine" value={form.engine} onChange={set} placeholder="e.g. 2.5L I5" />
            </div>
            <div className="form-field">
              <label>Transmission</label>
              <input type="text" name="transmission" value={form.transmission} onChange={set} placeholder="e.g. 6-speed manual" />
            </div>
            <div className="form-field">
              <label>Drivetrain</label>
              <select name="drivetrain" value={form.drivetrain} onChange={set}>
                <option value="">— Select —</option>
                {DRIVETRAIN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Fuel Type</label>
              <select name="fuel_type" value={form.fuel_type} onChange={set}>
                <option value="">— Select —</option>
                {FUEL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Purchase Info</div>
          <div className="form-grid form-grid-3">
            <div className="form-field">
              <label>Purchase Date</label>
              <input type="date" name="purchase_date" value={form.purchase_date ?? ''} onChange={set} />
            </div>
            <div className="form-field">
              <label>Purchase Price (CAD)</label>
              <input type="number" name="purchase_price" value={form.purchase_price ?? ''} onChange={set} min={0} step={0.01} placeholder="0.00" />
            </div>
            <div className="form-field">
              <label>Mileage at Purchase (km)</label>
              <input type="number" name="purchase_mileage" value={form.purchase_mileage ?? ''} onChange={set} min={0} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Current State</div>
          <div className="form-grid form-grid-3">
            <div className="form-field">
              <label>Current Mileage (km)</label>
              <input type="number" name="current_mileage" value={form.current_mileage ?? ''} onChange={set} min={0} />
            </div>
            <div className="form-field full-width">
              <label>Notes</label>
              <textarea name="notes" value={form.notes} onChange={set} placeholder="Any notes about this vehicle..." />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Link to={isEdit ? `/cars/${carId}` : '/'} className="btn btn-ghost">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Car'}
          </button>
        </div>
      </form>
    </div>
  );
}
