from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from . import models, schemas


async def get_car(db: AsyncSession, car_id: int):
    result = await db.execute(select(models.Car).where(models.Car.id == car_id))
    return result.scalars().first()


async def get_cars(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(models.Car).offset(skip).limit(limit))
    return result.scalars().all()


async def create_car(db: AsyncSession, car: schemas.CarCreate):
    db_car = models.Car(**car.model_dump())
    db.add(db_car)
    await db.commit()
    await db.refresh(db_car)
    return db_car


async def update_car(db: AsyncSession, car_id: int, car: schemas.CarUpdate):
    result = await db.execute(select(models.Car).where(models.Car.id == car_id))
    db_car = result.scalars().first()
    if db_car is None:
        return None
    for key, value in car.model_dump(exclude_unset=True).items():
        setattr(db_car, key, value)
    await db.commit()
    await db.refresh(db_car)
    return db_car


async def delete_car(db: AsyncSession, car_id: int):
    result = await db.execute(select(models.Car).where(models.Car.id == car_id))
    db_car = result.scalars().first()
    if db_car is None:
        return None
    await db.delete(db_car)
    await db.commit()
    return db_car
