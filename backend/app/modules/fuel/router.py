from datetime import date as _Date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.fuel.models import FuelLog

router = APIRouter(prefix="/modules/fuel", tags=["fuel"])


class FuelLogCreate(BaseModel):
    date: _Date
    odometer: int = Field(ge=0)
    litres: float = Field(gt=0)
    price_per_litre: float = Field(gt=0)
    station: Optional[str] = None
    full_tank: bool = True


class FuelLogOut(BaseModel):
    id: int
    car_id: int
    date: _Date
    odometer: int
    litres: float
    price_per_litre: float
    station: Optional[str]
    full_tank: bool
    total_cost: float
    l_per_100km: Optional[float] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_efficiency(cls, entry: FuelLog, prev_odometer: Optional[int]) -> "FuelLogOut":
        l_per_100km = None
        if prev_odometer and entry.full_tank:
            km = entry.odometer - prev_odometer
            if km > 0:
                l_per_100km = round(entry.litres / km * 100, 2)
        return cls(
            id=entry.id,
            car_id=entry.car_id,
            date=entry.date,
            odometer=entry.odometer,
            litres=entry.litres,
            price_per_litre=entry.price_per_litre,
            station=entry.station,
            full_tank=bool(entry.full_tank),
            total_cost=round(entry.litres * entry.price_per_litre, 2),
            l_per_100km=l_per_100km,
        )


@router.get("/cars/{car_id}")
async def list_fuel_logs(car_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FuelLog).where(FuelLog.car_id == car_id).order_by(FuelLog.odometer)
    )
    entries = result.scalars().all()
    out = []
    for i, e in enumerate(entries):
        prev = entries[i - 1].odometer if i > 0 else None
        out.append(FuelLogOut.from_orm_with_efficiency(e, prev))
    return list(reversed(out))


@router.post("/cars/{car_id}", status_code=201)
async def create_fuel_log(car_id: int, body: FuelLogCreate, db: AsyncSession = Depends(get_db)):
    entry = FuelLog(
        car_id=car_id,
        date=body.date,
        odometer=body.odometer,
        litres=body.litres,
        price_per_litre=body.price_per_litre,
        station=body.station,
        full_tank=1 if body.full_tank else 0,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    result = await db.execute(
        select(FuelLog).where(FuelLog.car_id == car_id, FuelLog.odometer < body.odometer)
        .order_by(FuelLog.odometer.desc()).limit(1)
    )
    prev = result.scalar_one_or_none()
    return FuelLogOut.from_orm_with_efficiency(entry, prev.odometer if prev else None)


@router.delete("/{entry_id}", status_code=204)
async def delete_fuel_log(entry_id: int, db: AsyncSession = Depends(get_db)):
    entry = await db.get(FuelLog, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found.")
    await db.delete(entry)
    await db.commit()
