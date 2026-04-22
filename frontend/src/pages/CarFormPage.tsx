import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createCar, decodeVin, getCar, updateCar } from '../api/cars';
import type { CarCreate } from '../types/car';

const EMPTY: CarCreate = {
  make: '', model: '', year: new Date().getFullYear(),
  vin: '', license_plate: '',
  color: '', owner: '',
  trim: '', engine: '', transmission: '', drivetrain: '', fuel_type: '',
  purchase_date: '', purchase_price: undefined, purchase_mileage: undefined,
  current_mileage: undefined, notes: '',
  horsepower: undefined, torque_lbft: undefined, zero_to_100_s: undefined,
  top_speed_kmh: undefined, weight_kg: undefined,
  fuel_city: '', fuel_highway: '', fuel_tank_l: undefined,
  oil_capacity_l: undefined, oil_type: '', coolant_capacity_l: undefined,
  tire_size_summer: '', tire_size_winter: '',
  front_disk_mm: undefined, rear_disk_mm: undefined,
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
  const [decoding, setDecoding] = useState(false);
  const [decodeMsg, setDecodeMsg] = useState<string | null>(null);
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
          horsepower: car.horsepower,
          torque_lbft: car.torque_lbft,
          zero_to_100_s: car.zero_to_100_s,
          top_speed_kmh: car.top_speed_kmh,
          weight_kg: car.weight_kg,
          fuel_city: car.fuel_city ?? '',
          fuel_highway: car.fuel_highway ?? '',
          fuel_tank_l: car.fuel_tank_l,
          oil_capacity_l: car.oil_capacity_l,
          oil_type: car.oil_type ?? '',
          coolant_capacity_l: car.coolant_capacity_l,
          tire_size_summer: car.tire_size_summer ?? '',
          tire_size_winter: car.tire_size_winter ?? '',
          front_disk_mm: car.front_disk_mm,
          rear_disk_mm: car.rear_disk_mm,
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
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value,
    }));
  };

  const handleDecodeVin = async () => {
    const vin = form.vin?.trim();
    if (!vin || vin.length !== 17) {
      setDecodeMsg('Enter a valid 17-character VIN first.');
      return;
    }
    setDecoding(true);
    setDecodeMsg(null);
    try {
      const decoded = await decodeVin(vin);
      setForm((prev) => ({
        ...prev,
        make: decoded.make || prev.make,
        model: decoded.model || prev.model,
        year: decoded.year || prev.year,
        trim: decoded.trim || prev.trim,
        engine: decoded.engine || prev.engine,
        transmission: decoded.transmission || prev.transmission,
        drivetrain: decoded.drivetrain || prev.drivetrain,
        fuel_type: decoded.fuel_type || prev.fuel_type,
        horsepower: decoded.horsepower || prev.horsepower,
        weight_kg: decoded.weight_kg || prev.weight_kg,
      }));
      setDecodeMsg('VIN decoded — review and adjust before saving.');
    } catch {
      setDecodeMsg('Could not decode VIN. Check your connection or try again.');
    } finally {
      setDecoding(false);
    }
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
            <div className="form-field" style={{ position: 'relative' }}>
              <label>VIN *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" name="vin" value={form.vin} onChange={set} required maxLength={17} placeholder="17-character VIN" style={{ fontFamily: 'monospace', flex: 1 }} />
                <button type="button" className="btn btn-secondary" onClick={handleDecodeVin} disabled={decoding} style={{ whiteSpace: 'nowrap' }}>
                  {decoding ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : '🔍 Decode'}
                </button>
              </div>
              {decodeMsg && <div style={{ fontSize: '12px', marginTop: '4px', color: decodeMsg.startsWith('VIN decoded') ? 'var(--success)' : 'var(--warning)' }}>{decodeMsg}</div>}
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
              <input type="text" name="trim" value={form.trim} onChange={set} placeholder="e.g. Highline, Sportline" />
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
              <input type="text" name="transmission" value={form.transmission} onChange={set} placeholder="e.g. 6-speed Manual" />
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
            <div className="form-field">
              <label>Horsepower (hp)</label>
              <input type="number" name="horsepower" value={form.horsepower ?? ''} onChange={set} min={0} placeholder="e.g. 170" />
            </div>
            <div className="form-field">
              <label>Torque (lb-ft)</label>
              <input type="number" name="torque_lbft" value={form.torque_lbft ?? ''} onChange={set} min={0} placeholder="e.g. 177" />
            </div>
            <div className="form-field">
              <label>Weight (kg)</label>
              <input type="number" name="weight_kg" value={form.weight_kg ?? ''} onChange={set} min={0} placeholder="e.g. 1381" />
            </div>
            <div className="form-field">
              <label>0–100 km/h (s)</label>
              <input type="number" name="zero_to_100_s" value={form.zero_to_100_s ?? ''} onChange={set} min={0} step={0.1} placeholder="e.g. 8.5" />
            </div>
            <div className="form-field">
              <label>Top Speed (km/h)</label>
              <input type="number" name="top_speed_kmh" value={form.top_speed_kmh ?? ''} onChange={set} min={0} placeholder="e.g. 209" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Fuel Economy</div>
          <div className="form-grid form-grid-3">
            <div className="form-field">
              <label>City (L/100km)</label>
              <input type="text" name="fuel_city" value={form.fuel_city ?? ''} onChange={set} placeholder="e.g. 9.9L/100km" />
            </div>
            <div className="form-field">
              <label>Highway (L/100km)</label>
              <input type="text" name="fuel_highway" value={form.fuel_highway ?? ''} onChange={set} placeholder="e.g. 6.2L/100km" />
            </div>
            <div className="form-field">
              <label>Fuel Tank (L)</label>
              <input type="number" name="fuel_tank_l" value={form.fuel_tank_l ?? ''} onChange={set} min={0} step={0.5} placeholder="e.g. 55" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Fluids</div>
          <div className="form-grid form-grid-3">
            <div className="form-field">
              <label>Oil Capacity (L)</label>
              <input type="number" name="oil_capacity_l" value={form.oil_capacity_l ?? ''} onChange={set} min={0} step={0.1} placeholder="e.g. 6.3" />
            </div>
            <div className="form-field">
              <label>Oil Type</label>
              <input type="text" name="oil_type" value={form.oil_type ?? ''} onChange={set} placeholder="e.g. 0W40" />
            </div>
            <div className="form-field">
              <label>Coolant Capacity (L)</label>
              <input type="number" name="coolant_capacity_l" value={form.coolant_capacity_l ?? ''} onChange={set} min={0} step={0.1} placeholder="e.g. 6.0" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Tires &amp; Brakes</div>
          <div className="form-grid form-grid-3">
            <div className="form-field">
              <label>Summer Tire Size</label>
              <input type="text" name="tire_size_summer" value={form.tire_size_summer ?? ''} onChange={set} placeholder="e.g. 225/45R17" />
            </div>
            <div className="form-field">
              <label>Winter Tire Size</label>
              <input type="text" name="tire_size_winter" value={form.tire_size_winter ?? ''} onChange={set} placeholder="e.g. 205/55R16" />
            </div>
            <div className="form-field">
              <label>Front Disk Diameter (mm)</label>
              <input type="number" name="front_disk_mm" value={form.front_disk_mm ?? ''} onChange={set} min={0} placeholder="e.g. 288" />
            </div>
            <div className="form-field">
              <label>Rear Disk Diameter (mm)</label>
              <input type="number" name="rear_disk_mm" value={form.rear_disk_mm ?? ''} onChange={set} min={0} placeholder="e.g. 272" />
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
