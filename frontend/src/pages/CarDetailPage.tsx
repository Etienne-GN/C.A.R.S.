import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Car, CarUpdate } from '../types/car';
import { getCar, updateCar, deleteCar } from '../api/cars';

const CarDetailPage = () => {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const [car, setCar] = useState<Car | null>(null);
  const [form, setForm] = useState<CarUpdate>({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carId) return;
    let cancelled = false;
    getCar(Number(carId))
      .then((data) => {
        if (cancelled) return;
        setCar(data);
        setForm(data);
      })
      .catch(() => {
        if (!cancelled) setError('Car not found.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [carId]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === 'year') {
        const parsed = parseInt(value, 10);
        return { ...prev, year: Number.isNaN(parsed) ? undefined : parsed };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!carId) return;
    setError(null);
    try {
      const updated = await updateCar(Number(carId), form);
      setCar(updated);
      setForm(updated);
      setEditing(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 409 ? 'Another car already has this VIN or license plate.' : 'Failed to update car.');
    }
  };

  const handleCancel = () => {
    setForm(car ?? {});
    setEditing(false);
    setError(null);
  };

  const handleDelete = async () => {
    if (!carId || !car) return;
    if (!window.confirm(`Delete ${car.year} ${car.make} ${car.model}?`)) return;
    setError(null);
    try {
      await deleteCar(Number(carId));
      navigate('/cars');
    } catch {
      setError('Failed to delete car.');
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error && !car) return (
    <div>
      <p style={{ color: 'red' }}>{error}</p>
      <Link to="/cars">← Back to Garage</Link>
    </div>
  );
  if (!car) return null;

  const currentYear = new Date().getFullYear();

  return (
    <div>
      <Link to="/cars">← Back to Garage</Link>
      <h2>{car.year} {car.make} {car.model}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {editing ? (
        <form onSubmit={handleSave}>
          <input type="text" name="make" placeholder="Make" value={form.make ?? ''} onChange={handleInputChange} required />
          <input type="text" name="model" placeholder="Model" value={form.model ?? ''} onChange={handleInputChange} required />
          <input type="number" name="year" placeholder="Year" value={form.year ?? currentYear} onChange={handleInputChange} required />
          <input type="text" name="vin" placeholder="VIN" value={form.vin ?? ''} onChange={handleInputChange} required />
          <input type="text" name="license_plate" placeholder="License Plate" value={form.license_plate ?? ''} onChange={handleInputChange} required />
          <input type="text" name="color" placeholder="Color" value={form.color ?? ''} onChange={handleInputChange} required />
          <input type="text" name="owner" placeholder="Owner" value={form.owner ?? ''} onChange={handleInputChange} required />
          <button type="submit">Save</button>
          <button type="button" onClick={handleCancel}>Cancel</button>
        </form>
      ) : (
        <>
          <dl>
            <dt>VIN</dt><dd>{car.vin}</dd>
            <dt>License Plate</dt><dd>{car.license_plate}</dd>
            <dt>Color</dt><dd>{car.color}</dd>
            <dt>Owner</dt><dd>{car.owner}</dd>
          </dl>
          <button onClick={() => setEditing(true)}>Edit</button>
          <button onClick={handleDelete}>Delete</button>
        </>
      )}
    </div>
  );
};

export default CarDetailPage;
