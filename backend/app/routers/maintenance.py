from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud, schemas
from ..database import get_db

router = APIRouter(tags=["maintenance"])


@router.get("/cars/{car_id}/maintenance/", response_model=list[schemas.ScheduledMaintenance])
async def list_maintenance(car_id: int, db: AsyncSession = Depends(get_db)):
    return await crud.get_scheduled_maintenance(db, car_id)


@router.post("/cars/{car_id}/maintenance/", response_model=schemas.ScheduledMaintenance, status_code=201)
async def create_maintenance(
    car_id: int, item: schemas.ScheduledMaintenanceCreate, db: AsyncSession = Depends(get_db)
):
    car = await crud.get_car(db, car_id)
    if car is None:
        raise HTTPException(status_code=404, detail="Car not found.")
    return await crud.create_scheduled_maintenance(db, car_id, item)


@router.patch("/maintenance/{item_id}", response_model=schemas.ScheduledMaintenance)
async def update_maintenance(
    item_id: int, item: schemas.ScheduledMaintenanceUpdate, db: AsyncSession = Depends(get_db)
):
    updated = await crud.update_scheduled_maintenance(db, item_id, item)
    if updated is None:
        raise HTTPException(status_code=404, detail="Maintenance item not found.")
    return updated


@router.delete("/maintenance/{item_id}", status_code=204)
async def delete_maintenance(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await crud.delete_scheduled_maintenance(db, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Maintenance item not found.")
