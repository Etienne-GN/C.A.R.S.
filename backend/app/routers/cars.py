from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/cars", tags=["cars"])


@router.get("/", response_model=list[schemas.CarSummary])
async def list_cars(db: AsyncSession = Depends(get_db)):
    return await crud.get_cars_summary(db)


@router.post("/", response_model=schemas.Car, status_code=201)
async def create_car(car: schemas.CarCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.create_car(db, car)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A car with this VIN or license plate already exists.")


@router.get("/{car_id}", response_model=schemas.Car)
async def get_car(car_id: int, db: AsyncSession = Depends(get_db)):
    car = await crud.get_car(db, car_id)
    if car is None:
        raise HTTPException(status_code=404, detail="Car not found.")
    return car


@router.patch("/{car_id}", response_model=schemas.Car)
async def update_car(car_id: int, car: schemas.CarUpdate, db: AsyncSession = Depends(get_db)):
    try:
        updated = await crud.update_car(db, car_id, car)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A car with this VIN or license plate already exists.")
    if updated is None:
        raise HTTPException(status_code=404, detail="Car not found.")
    return updated


@router.delete("/{car_id}", status_code=204)
async def delete_car(car_id: int, db: AsyncSession = Depends(get_db)):
    car = await crud.delete_car(db, car_id)
    if car is None:
        raise HTTPException(status_code=404, detail="Car not found.")
