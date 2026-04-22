import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/modules/fuses", tags=["fuses"])

DATA_DIR = Path(__file__).parent / "data"


def _list_panel_files() -> list[Path]:
    if not DATA_DIR.exists():
        return []
    return sorted(DATA_DIR.glob("*.json"))


@router.get("/")
async def list_panels():
    panels = []
    for path in _list_panel_files():
        try:
            data = json.loads(path.read_text())
            panels.append({
                "key": data["key"],
                "title": data["title"],
                "description": data.get("description", ""),
            })
        except Exception:
            continue
    return panels


@router.get("/{panel_key}")
async def get_panel(panel_key: str):
    path = DATA_DIR / f"{panel_key}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Fuse panel not found.")
    return json.loads(path.read_text())
