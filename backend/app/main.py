from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from . import crud, models, schemas
from .database import engine, get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="C.A.R.S. - Cars Archive of Repairs and Services", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Welcome to C.A.R.S. - Cars Archive of Repairs and Services"}


@app.post("/cars/", response_model=schemas.Car, status_code=201)
async def create_car(car: schemas.CarCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.create_car(db=db, car=car)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A car with this VIN or license plate already exists")


@app.get("/cars/", response_model=list[schemas.Car])
async def read_cars(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await crud.get_cars(db, skip=skip, limit=limit)


@app.get("/cars/{car_id}", response_model=schemas.Car)
async def read_car(car_id: int, db: AsyncSession = Depends(get_db)):
    db_car = await crud.get_car(db, car_id=car_id)
    if db_car is None:
        raise HTTPException(status_code=404, detail="Car not found")
    return db_car


@app.patch("/cars/{car_id}", response_model=schemas.Car)
async def update_car(car_id: int, car: schemas.CarUpdate, db: AsyncSession = Depends(get_db)):
    try:
        db_car = await crud.update_car(db, car_id=car_id, car=car)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A car with this VIN or license plate already exists")
    if db_car is None:
        raise HTTPException(status_code=404, detail="Car not found")
    return db_car


@app.delete("/cars/{car_id}", status_code=204)
async def delete_car(car_id: int, db: AsyncSession = Depends(get_db)):
    db_car = await crud.delete_car(db, car_id=car_id)
    if db_car is None:
        raise HTTPException(status_code=404, detail="Car not found")
