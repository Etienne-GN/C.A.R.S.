from datetime import date as _Date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.tires.models import TireSet, TreadReading

router = APIRouter(prefix="/modules/tires", tags=["tires"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class TreadReadingCreate(BaseModel):
    date: _Date
    odometer: Optional[int] = None
    fl: Optional[float] = Field(default=None, ge=0, le=20)
    fr: Optional[float] = Field(default=None, ge=0, le=20)
    rl: Optional[float] = Field(default=None, ge=0, le=20)
    rr: Optional[float] = Field(default=None, ge=0, le=20)


class TireSetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    brand: Optional[str] = None
    model: Optional[str] = None
    size: Optional[str] = None
    season: Optional[str] = None
    installed_date: Optional[_Date] = None
    installed_odometer: Optional[int] = None
    notes: Optional[str] = None


class TireSetUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    brand: Optional[str] = None
    model: Optional[str] = None
    size: Optional[str] = None
    season: Optional[str] = None
    installed_date: Optional[_Date] = None
    installed_odometer: Optional[int] = None
    notes: Optional[str] = None


def _serialize_set(ts: TireSet) -> dict:
    latest = ts.tread_readings[0] if ts.tread_readings else None
    return {
        "id": ts.id,
        "car_id": ts.car_id,
        "name": ts.name,
        "brand": ts.brand,
        "model": ts.model,
        "size": ts.size,
        "season": ts.season,
        "installed_date": ts.installed_date,
        "installed_odometer": ts.installed_odometer,
        "notes": ts.notes,
        "latest_tread": {
            "date": latest.date,
            "fl": latest.fl,
            "fr": latest.fr,
            "rl": latest.rl,
            "rr": latest.rr,
        } if latest else None,
        "readings_count": len(ts.tread_readings),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/cars/{car_id}")
async def list_tire_sets(car_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TireSet).where(TireSet.car_id == car_id).options(selectinload(TireSet.tread_readings))
    )
    return [_serialize_set(ts) for ts in result.scalars().all()]


@router.post("/cars/{car_id}", status_code=201)
async def create_tire_set(car_id: int, body: TireSetCreate, db: AsyncSession = Depends(get_db)):
    ts = TireSet(car_id=car_id, **body.model_dump(exclude_none=True))
    db.add(ts)
    await db.commit()
    result = await db.execute(
        select(TireSet).where(TireSet.id == ts.id).options(selectinload(TireSet.tread_readings))
    )
    ts = result.scalar_one()
    return _serialize_set(ts)


@router.patch("/{set_id}")
async def update_tire_set(set_id: int, body: TireSetUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TireSet).where(TireSet.id == set_id).options(selectinload(TireSet.tread_readings))
    )
    ts = result.scalar_one_or_none()
    if ts is None:
        raise HTTPException(status_code=404, detail="Tire set not found.")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(ts, k, v)
    await db.commit()
    result = await db.execute(
        select(TireSet).where(TireSet.id == set_id).options(selectinload(TireSet.tread_readings))
    )
    ts = result.scalar_one()
    return _serialize_set(ts)


@router.delete("/{set_id}", status_code=204)
async def delete_tire_set(set_id: int, db: AsyncSession = Depends(get_db)):
    ts = await db.get(TireSet, set_id)
    if ts is None:
        raise HTTPException(status_code=404, detail="Tire set not found.")
    await db.delete(ts)
    await db.commit()


@router.post("/{set_id}/readings", status_code=201)
async def add_tread_reading(set_id: int, body: TreadReadingCreate, db: AsyncSession = Depends(get_db)):
    ts = await db.get(TireSet, set_id)
    if ts is None:
        raise HTTPException(status_code=404, detail="Tire set not found.")
    reading = TreadReading(tire_set_id=set_id, **body.model_dump(exclude_none=True))
    db.add(reading)
    await db.commit()
    return {"id": reading.id}


@router.delete("/readings/{reading_id}", status_code=204)
async def delete_reading(reading_id: int, db: AsyncSession = Depends(get_db)):
    r = await db.get(TreadReading, reading_id)
    if r is None:
        raise HTTPException(status_code=404, detail="Reading not found.")
    await db.delete(r)
    await db.commit()
