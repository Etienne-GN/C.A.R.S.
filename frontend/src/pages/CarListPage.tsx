import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Car, CarCreate } from '../types/car';
import { getCars, createCar } from '../api/cars';

const EMPTY_FORM: CarCreate = {
  make: '',
  model: '',
  year: new Date().getFullYear(),
  vin: '',
  license_plate: '',
  color: '',
  owner: '',
};

const CarListPage = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [newCar, setNewCar] = useState<CarCreate>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCars()
      .then((data) => {
        if (!cancelled) setCars(data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load cars.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCar((prev) => {
      if (name === 'year') {
        const parsed = parseInt(value, 10);
        return { ...prev, year: Number.isNaN(parsed) ? prev.year : parsed };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleCreateCar = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await createCar(newCar);
      setCars((prev) => [...prev, created]);
      setNewCar(EMPTY_FORM);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 409 ? 'A car with this VIN or license plate already exists.' : 'Failed to create car.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>My Garage</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Add New Car</h3>
      <form onSubmit={handleCreateCar}>
        <input type="text" name="make" placeholder="Make" value={newCar.make} onChange={handleInputChange} required />
        <input type="text" name="model" placeholder="Model" value={newCar.model} onChange={handleInputChange} required />
        <input type="number" name="year" placeholder="Year" value={newCar.year} onChange={handleInputChange} required />
        <input type="text" name="vin" placeholder="VIN" value={newCar.vin} onChange={handleInputChange} required />
        <input type="text" name="license_plate" placeholder="License Plate" value={newCar.license_plate} onChange={handleInputChange} required />
        <input type="text" name="color" placeholder="Color" value={newCar.color} onChange={handleInputChange} required />
        <input type="text" name="owner" placeholder="Owner" value={newCar.owner} onChange={handleInputChange} required />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add Car'}
        </button>
      </form>

      <h3>Your Cars</h3>
      {loading ? (
        <p>Loading…</p>
      ) : cars.length === 0 ? (
        <p>No cars added yet. Add one above!</p>
      ) : (
        <ul>
          {cars.map((car) => (
            <li key={car.id}>
              <Link to={`/cars/${car.id}`}>
                {car.year} {car.make} {car.model} ({car.license_plate})
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CarListPage;
