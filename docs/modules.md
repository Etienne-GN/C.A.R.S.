# Creating a C.A.R.S. Module

Modules are self-contained feature packs that plug into C.A.R.S. at runtime. They appear on the **Modules** management page and can be activated to show up in the sidebar.

The built-in **Fuse Panels** module (`backend/app/modules/fuses/`) is a good reference to follow along with.

---

## Structure

A module lives in its own folder under `backend/app/modules/<your_module_key>/`:

```
backend/app/modules/your_module/
├── manifest.json   ← metadata (required)
├── registry.py     ← route registration hook (required)
├── router.py       ← FastAPI router with your endpoints
└── data/           ← optional static data (JSON files, etc.)
```

---

## 1. manifest.json

Describes the module to C.A.R.S.

```json
{
  "key":         "your_module",
  "title":       "Your Module",
  "icon":        "🔧",
  "description": "A short description shown on the Modules page.",
  "route":       "/modules/your_module"
}
```

| Field | Description |
|---|---|
| `key` | Unique identifier, must match the folder name |
| `title` | Display name in the sidebar and Modules page |
| `icon` | Emoji shown next to the title |
| `description` | One-liner shown on the Modules management page |
| `route` | Frontend path the sidebar link points to |

---

## 2. registry.py

Called once at startup to register your routes with the FastAPI app.

```python
from fastapi import FastAPI
from . import router as module_router

def register_routes(app: FastAPI) -> None:
    app.include_router(module_router.router)
```

---

## 3. router.py

A standard FastAPI `APIRouter`. Prefix it with `/modules/<your_key>` to avoid collisions.

```python
from fastapi import APIRouter

router = APIRouter(prefix="/modules/your_module", tags=["your_module"])

@router.get("/")
async def list_items():
    return [{"id": 1, "name": "Example"}]

@router.get("/{item_id}")
async def get_item(item_id: str):
    return {"id": item_id, "name": "Example"}
```

You can use SQLAlchemy, file I/O, or anything else here — it's just a normal FastAPI router.

---

## 4. Frontend

C.A.R.S. doesn't auto-load frontend pages for modules — you add them manually to the main app.

**Add your page(s)** in `frontend/src/pages/`:

```tsx
// frontend/src/pages/YourModulePage.tsx
export default function YourModulePage() {
  return <div>Your module UI</div>;
}
```

**Register the route** in `frontend/src/App.tsx`:

```tsx
import YourModulePage from './pages/YourModulePage';

// inside <Routes>:
<Route path="modules/your_module" element={<YourModulePage />} />
```

**Add a Vite proxy entry** in `frontend/vite.config.ts` (dev only — Nginx handles prod):

```ts
'/modules': 'http://localhost:8000',
```

This is already present since all `/modules/*` traffic is proxied as a group.

---

## 5. Data files (optional)

If your module serves static reference data (like fuse panel layouts), put JSON files in `data/` and load them from `router.py`:

```python
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

@router.get("/")
async def list_items():
    return [{"key": f.stem} for f in DATA_DIR.glob("*.json")]

@router.get("/{key}")
async def get_item(key: str):
    path = DATA_DIR / f"{key}.json"
    if not path.exists():
        raise HTTPException(status_code=404)
    return json.loads(path.read_text())
```

---

## Checklist

- [ ] Folder name matches `key` in `manifest.json`
- [ ] `registry.py` exports `register_routes(app)`
- [ ] Router prefix starts with `/modules/<key>`
- [ ] Frontend route added in `App.tsx`
- [ ] Module `route` in `manifest.json` matches the frontend path
