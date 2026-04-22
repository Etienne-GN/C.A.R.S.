import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query

router = APIRouter(prefix="/modules/obd", tags=["obd"])

_DATA = json.loads((Path(__file__).parent / "data" / "codes.json").read_text())


@router.get("/")
async def search_codes(q: Optional[str] = Query(default=None)):
    if not q or not q.strip():
        return _DATA
    q = q.strip().upper()
    return [
        c for c in _DATA
        if q in c["code"].upper()
        or q in c["description"].upper()
        or q in c["system"].upper()
    ]
