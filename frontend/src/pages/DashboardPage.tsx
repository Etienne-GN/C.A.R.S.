import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCars } from '../api/cars';
import type { CarSummary } from '../types/car';

function fmtMileage(km?: number) {
  if (km == null) return '—';
  return km.toLocaleString() + ' km';
}

function fmtCurrency(n: number) {
  return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
}

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function dueBadge(car: CarSummary) {
  if (!car.next_due_date) return null;
  const today = new Date();
  const due = new Date(car.next_due_date + 'T00:00:00');
  const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  if (days < 0) return <span className="badge badge-overdue">Overdue</span>;
  if (days <= 30) return <span className="badge badge-due-soon">Due soon</span>;
  return null;
}

function CarCard({ car }: { car: CarSummary }) {
  return (
    <Link
      to={`/cars/${car.id}`}
      className="car-card"
      style={car.is_archived ? { opacity: 0.45, filter: 'grayscale(0.5)' } : undefined}
    >
      {car.photo_filename && (
        <img
          src={`/uploads/${car.photo_filename}`}
          alt={`${car.make} ${car.model}`}
          style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px 8px 0 0', display: 'block', marginBottom: '-4px' }}
        />
      )}
      <div className="car-card-header">
        <div>
          <div className="car-card-title">{car.year} {car.make} {car.model}</div>
          <div className="car-card-subtitle">
            {car.trim && <span>{car.trim} · </span>}
            {car.owner && <span>{car.owner}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span className="badge badge-plate">{car.license_plate}</span>
          {car.is_archived
            ? <span className="badge" style={{ background: '#2a2a2a', color: '#666' }}>Archived</span>
            : dueBadge(car)}
        </div>
      </div>
      <div className="car-card-stats">
        <div className="car-stat">
          <span className="car-stat-value">{fmtMileage(car.current_mileage)}</span>
          <span className="car-stat-label">Mileage</span>
        </div>
        <div className="car-stat">
          <span className="car-stat-value">{car.service_count}</span>
          <span className="car-stat-label">Services</span>
        </div>
        <div className="car-stat">
          <span className="car-stat-value">{fmtCurrency(car.total_spent)}</span>
          <span className="car-stat-label">Total Spent</span>
        </div>
        <div className="car-stat">
          <span className="car-stat-value">{fmtDate(car.last_service_date)}</span>
          <span className="car-stat-label">Last Service</span>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [cars, setCars] = useState<CarSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const ctrl = new AbortController();
    getCars(ctrl.signal)
      .then(setCars)
      .catch(() => setError('Failed to load garage.'))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  const filtered = query.trim()
    ? cars.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.make.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q) ||
          String(c.year).includes(q) ||
          c.license_plate.toLowerCase().includes(q) ||
          (c.owner ?? '').toLowerCase().includes(q) ||
          (c.trim ?? '').toLowerCase().includes(q)
        );
      })
    : cars;

  const sorted = [...filtered].sort((a, b) => (a.is_archived ? 1 : 0) - (b.is_archived ? 1 : 0));

  if (loading) return <div className="loading-page"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">My Garage</div>
          <div className="page-subtitle">
            {cars.filter(c => !c.is_archived).length} active
            {cars.some(c => c.is_archived) && `, ${cars.filter(c => c.is_archived).length} archived`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="search"
            placeholder="Search make, model, plate…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '220px' }}
          />
          <Link to="/cars/new" className="btn btn-primary">＋ Add Car</Link>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {cars.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🚗</div>
          <div className="empty-state-title">No cars yet</div>
          <div className="empty-state-sub">Add your first vehicle to get started.</div>
          <Link to="/cars/new" className="btn btn-primary">Add Car</Link>
        </div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No results</div>
          <div className="empty-state-sub">No cars match "{query}".</div>
        </div>
      ) : (
        <div className="car-grid">
          {sorted.map((car) => <CarCard key={car.id} car={car} />)}
        </div>
      )}
    </div>
  );
}
