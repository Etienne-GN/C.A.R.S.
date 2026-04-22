from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .. import schemas
from ..database import get_db
from ..models import Car, CarNote

router = APIRouter(prefix="/cars", tags=["notes"])


@router.get("/{car_id}/notes", response_model=list[schemas.CarNote])
async def list_notes(car_id: int, db: AsyncSession = Depends(get_db)):
    car = await db.get(Car, car_id)
    if car is None:
        raise HTTPException(status_code=404, detail="Car not found.")
    result = await db.execute(
        select(CarNote).where(CarNote.car_id == car_id).order_by(CarNote.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{car_id}/notes", response_model=schemas.CarNote, status_code=201)
async def create_note(car_id: int, note: schemas.CarNoteCreate, db: AsyncSession = Depends(get_db)):
    car = await db.get(Car, car_id)
    if car is None:
        raise HTTPException(status_code=404, detail="Car not found.")
    db_note = CarNote(car_id=car_id, **note.model_dump())
    db.add(db_note)
    await db.commit()
    await db.refresh(db_note)
    return db_note


@router.patch("/notes/{note_id}", response_model=schemas.CarNote)
async def update_note(note_id: int, note: schemas.CarNoteUpdate, db: AsyncSession = Depends(get_db)):
    db_note = await db.get(CarNote, note_id)
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found.")
    for field, value in note.model_dump(exclude_unset=True).items():
        setattr(db_note, field, value)
    await db.commit()
    await db.refresh(db_note)
    return db_note


@router.delete("/notes/{note_id}", status_code=204)
async def delete_note(note_id: int, db: AsyncSession = Depends(get_db)):
    db_note = await db.get(CarNote, note_id)
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found.")
    await db.delete(db_note)
    await db.commit()
