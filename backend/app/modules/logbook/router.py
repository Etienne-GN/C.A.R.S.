from datetime import date as _Date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.logbook.models import TripLog

router = APIRouter(prefix="/modules/logbook", tags=["logbook"])


class TripLogCreate(BaseModel):
    date: _Date
    distance_km: float = Field(gt=0)
    start_location: Optional[str] = Field(default=None, max_length=200)
    end_location: Optional[str] = Field(default=None, max_length=200)
    duration_min: Optional[int] = Field(default=None, ge=0)
    purpose: Optional[str] = Field(default=None, max_length=100)
    fuel_cost: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = None


class TripLogOut(BaseModel):
    id: int
    car_id: int
    date: _Date
    distance_km: float
    start_location: Optional[str]
    end_location: Optional[str]
    duration_min: Optional[int]
    purpose: Optional[str]
    fuel_cost: Optional[float]
    notes: Optional[str]

    model_config = {"from_attributes": True}


@router.get("/cars/{car_id}", response_model=list[TripLogOut])
async def list_trips(car_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TripLog).where(TripLog.car_id == car_id).order_by(TripLog.date.desc())
    )
    return result.scalars().all()


@router.post("/cars/{car_id}", response_model=TripLogOut, status_code=201)
async def create_trip(car_id: int, body: TripLogCreate, db: AsyncSession = Depends(get_db)):
    trip = TripLog(car_id=car_id, **body.model_dump())
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip


@router.patch("/{trip_id}", response_model=TripLogOut)
async def update_trip(trip_id: int, body: TripLogCreate, db: AsyncSession = Depends(get_db)):
    trip = await db.get(TripLog, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)
    await db.commit()
    await db.refresh(trip)
    return trip


@router.delete("/{trip_id}", status_code=204)
async def delete_trip(trip_id: int, db: AsyncSession = Depends(get_db)):
    trip = await db.get(TripLog, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found.")
    await db.delete(trip)
    await db.commit()
