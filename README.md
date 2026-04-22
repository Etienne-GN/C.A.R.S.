# C.A.R.S. — Cars Archive of Repairs & Services

A self-hosted web app for tracking your vehicles, service history, parts, costs, and maintenance schedules. Built for people who actually wrench on their cars and want to keep receipts.

## Features

- **Garage** — manage multiple vehicles with full specs (make, model, year, VIN, engine, transmission, etc.)
- **Service Records** — log every job with date, mileage, shop, labour cost, work hours, parts used, and file attachments (photos, PDFs)
- **Parts Tracking** — per-service parts list with brand, part number, quantity, unit cost, and supplier
- **Scheduled Maintenance** — set due dates and mileage intervals; overdue items surface on the car detail page
- **Archive** — mark cars as inactive without deleting their history
- **Module System** — extend C.A.R.S. with optional modules; activate them from the sidebar. Ships with a **Fuse Panels** module for electrical reference diagrams

## Stack

| Layer | Tech |
|---|---|
| Backend | Python · FastAPI · SQLAlchemy (async) · SQLite |
| Frontend | React · TypeScript · Vite · React Router v6 |
| Deployment | Nginx · Alpine Linux (via [A.E.G.I.S.](https://github.com/Etienne-GN/A.E.G.I.S.)) |

## Self-Hosting

C.A.R.S. is designed to be deployed as part of the A.E.G.I.S. home server provisioning system. If you're running A.E.G.I.S., it installs automatically.

### Manual Setup

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev       # development (proxies API to :8000)
npm run build     # production build → dist/
```

Point Nginx (or any reverse proxy) at `dist/` for static files and proxy `/cars`, `/services`, `/parts`, `/maintenance`, `/attachments`, `/uploads`, `/modules` to port `8000`.

## Module System

C.A.R.S. supports optional plug-in modules. See [`docs/modules.md`](docs/modules.md) for a full guide on creating your own.

Modules are activated from the **Modules** page in the sidebar and appear as direct links once enabled.

## License

MIT — see [LICENSE](LICENSE).
