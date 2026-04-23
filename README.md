# C.A.R.S. — Cars Archive of Repairs & Services

A self-hosted web app for tracking your vehicles, service history, parts, costs, and maintenance schedules. Built for people who actually wrench on their cars and want to keep receipts.

## Features

- **Garage** — manage multiple vehicles with full specs (make, model, year, VIN, engine, transmission, performance, fluids, tires, and more)
- **VIN Decoder** — auto-fill specs from a VIN using the free NHTSA database
- **Service Records** — log every job with date, mileage, shop, labour cost, work hours, parts used, and file attachments (photos, PDFs)
- **Parts Tracking** — per-service parts list with brand, part number, quantity, unit cost, and supplier
- **Scheduled Maintenance** — set due dates and mileage intervals; overdue items surface on the car detail page
- **Notes** — per-vehicle notes with expandable cards, for observations, quirks, or reference info
- **Photo Upload** — attach a photo to each vehicle
- **Archive** — mark cars as inactive without deleting their history
- **Module System** — extend C.A.R.S. with optional modules activated from the sidebar. Ships with Fuse Panels, Fuel Log, Recall Checker, Tire Tracker, and OBD Code Reference

## Stack

| Layer | Tech |
|---|---|
| Backend | Python · FastAPI · SQLAlchemy (async) · SQLite |
| Frontend | React · TypeScript · Vite · React Router v6 |
| Deployment | Nginx · Alpine Linux (via [A.E.G.I.S.](https://github.com/Etienne-GN/A.E.G.I.S.)) |

## Running Locally

**Prerequisites:** Python 3.10+ and Node.js 18+

```bash
git clone https://github.com/Etienne-GN/C.A.R.S.
cd C.A.R.S.
./start.sh
```

That's it. The script creates the Python virtualenv, installs all dependencies, and starts both the backend and frontend automatically.

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

To stop everything:

```bash
./stop.sh
```

Logs are written to `.run/backend.log` and `.run/frontend.log`.

## Server Deployment (A.E.G.I.S.)

C.A.R.S. is designed to be deployed as part of the [A.E.G.I.S.](https://github.com/Etienne-GN/A.E.G.I.S.) home server provisioning system. If you're running A.E.G.I.S., it installs and configures automatically behind Nginx.

### Manual Server Setup

**Backend**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run build     # production build → dist/
```

Point Nginx at `dist/` for static files and proxy the following paths to port `8000`:
`/cars`, `/services`, `/parts`, `/maintenance`, `/attachments`, `/uploads`, `/modules`

## Module System

C.A.R.S. supports optional plug-in modules. See [`docs/modules.md`](docs/modules.md) for a full guide on creating your own.

Modules are activated from the **Modules** page in the sidebar and appear as direct links once enabled.

## License

MIT — see [LICENSE](LICENSE).
