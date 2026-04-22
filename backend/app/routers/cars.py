import uuid
from pathlib import Path
from typing import Optional

import aiofiles
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud, schemas
from ..config import settings
from ..database import get_db

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_PHOTO_SIZE = 10 * 1024 * 1024  # 10 MB

NHTSA_VPIC = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{}?format=json"

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


@router.get("/decode-vin")
async def decode_vin(vin: str = Query(..., min_length=17, max_length=17)):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(NHTSA_VPIC.format(vin))
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Failed to reach NHTSA VIN decoder.")

    def get(variable: str) -> Optional[str]:
        for r in data.get("Results", []):
            if r.get("Variable") == variable and r.get("Value") not in (None, "", "Not Applicable"):
                return r["Value"]
        return None

    def get_int(variable: str) -> Optional[int]:
        v = get(variable)
        try: return int(float(v)) if v else None
        except (ValueError, TypeError): return None

    def get_float(variable: str) -> Optional[float]:
        v = get(variable)
        try: return float(v) if v else None
        except (ValueError, TypeError): return None

    transmission_style = get("Transmission Style")
    transmission_speeds = get("Transmission Speeds")
    transmission = None
    if transmission_style:
        transmission = transmission_style
        if transmission_speeds:
            transmission = f"{transmission_speeds}-speed {transmission_style}"

    return {
        "make": get("Make"),
        "model": get("Model"),
        "year": get_int("Model Year"),
        "trim": get("Trim"),
        "engine": f"{get('Engine Configuration') or ''} {get('Displacement (L)') or ''}L".strip() or None,
        "transmission": transmission,
        "drivetrain": get("Drive Type"),
        "fuel_type": get("Fuel Type - Primary"),
        "horsepower": get_int("Engine Brake (hp) From"),
        "weight_kg": None,
        "doors": get_int("Doors"),
        "body_class": get("Body Class"),
        "cylinders": get_int("Engine Number of Cylinders"),
        "displacement_l": get_float("Displacement (L)"),
        "plant_country": get("Plant Country"),
    }


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


@router.post("/{car_id}/photo", response_model=schemas.Car)
async def upload_car_photo(car_id: int, file: UploadFile, db: AsyncSession = Depends(get_db)):
    car = await crud.get_car(db, car_id)
    if car is None:
        raise HTTPException(status_code=404, detail="Car not found.")
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed.")

    data = await file.read()
    if len(data) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="Photo must be under 10 MB.")

    ext = Path(file.filename or "photo.jpg").suffix or ".jpg"
    filename = f"car_{car_id}_{uuid.uuid4().hex}{ext}"
    dest = settings.upload_dir / filename
    async with aiofiles.open(dest, "wb") as f:
        await f.write(data)

    if car.photo_filename:
        old = settings.upload_dir / car.photo_filename
        if old.exists():
            old.unlink()

    return await crud.update_car(db, car_id, schemas.CarUpdate(photo_filename=filename))


@router.delete("/{car_id}/photo", response_model=schemas.Car)
async def delete_car_photo(car_id: int, db: AsyncSession = Depends(get_db)):
    car = await crud.get_car(db, car_id)
    if car is None:
        raise HTTPException(status_code=404, detail="Car not found.")
    if car.photo_filename:
        old = settings.upload_dir / car.photo_filename
        if old.exists():
            old.unlink()
    return await crud.update_car(db, car_id, schemas.CarUpdate(photo_filename=None))
