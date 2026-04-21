import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud, schemas
from ..config import settings
from ..database import get_db

router = APIRouter(tags=["services"])

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "text/plain",
}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


# ── Service Records ───────────────────────────────────────────────────────────

@router.get("/cars/{car_id}/services/", response_model=list[schemas.ServiceRecord])
async def list_services(car_id: int, db: AsyncSession = Depends(get_db)):
    return await crud.get_service_records(db, car_id)


@router.post("/cars/{car_id}/services/", response_model=schemas.ServiceRecord, status_code=201)
async def create_service(
    car_id: int, record: schemas.ServiceRecordCreate, db: AsyncSession = Depends(get_db)
):
    car = await crud.get_car(db, car_id)
    if car is None:
        raise HTTPException(status_code=404, detail="Car not found.")
    return await crud.create_service_record(db, car_id, record)


@router.get("/services/{service_id}", response_model=schemas.ServiceRecord)
async def get_service(service_id: int, db: AsyncSession = Depends(get_db)):
    record = await crud.get_service_record(db, service_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Service record not found.")
    return record


@router.patch("/services/{service_id}", response_model=schemas.ServiceRecord)
async def update_service(
    service_id: int, record: schemas.ServiceRecordUpdate, db: AsyncSession = Depends(get_db)
):
    updated = await crud.update_service_record(db, service_id, record)
    if updated is None:
        raise HTTPException(status_code=404, detail="Service record not found.")
    return updated


@router.delete("/services/{service_id}", status_code=204)
async def delete_service(service_id: int, db: AsyncSession = Depends(get_db)):
    record = await crud.delete_service_record(db, service_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Service record not found.")


# ── Parts ─────────────────────────────────────────────────────────────────────

@router.post("/services/{service_id}/parts/", response_model=schemas.Part, status_code=201)
async def add_part(service_id: int, part: schemas.PartCreate, db: AsyncSession = Depends(get_db)):
    record = await crud.get_service_record(db, service_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Service record not found.")
    return await crud.create_part(db, service_id, part)


@router.patch("/parts/{part_id}", response_model=schemas.Part)
async def update_part(part_id: int, part: schemas.PartUpdate, db: AsyncSession = Depends(get_db)):
    updated = await crud.update_part(db, part_id, part)
    if updated is None:
        raise HTTPException(status_code=404, detail="Part not found.")
    return updated


@router.delete("/parts/{part_id}", status_code=204)
async def delete_part(part_id: int, db: AsyncSession = Depends(get_db)):
    part = await crud.delete_part(db, part_id)
    if part is None:
        raise HTTPException(status_code=404, detail="Part not found.")


# ── Attachments ───────────────────────────────────────────────────────────────

@router.post("/services/{service_id}/attachments/", response_model=schemas.Attachment, status_code=201)
async def upload_attachment(
    service_id: int, file: UploadFile, db: AsyncSession = Depends(get_db)
):
    record = await crud.get_service_record(db, service_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Service record not found.")

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported file type.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 20 MB limit.")

    ext = Path(file.filename or "file").suffix.lower()
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest = settings.upload_dir / stored_name
    settings.upload_dir.mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(dest, "wb") as f:
        await f.write(content)

    return await crud.create_attachment(
        db,
        service_id,
        filename=stored_name,
        original_filename=file.filename or stored_name,
        mime_type=file.content_type,
        file_size=len(content),
    )


@router.delete("/attachments/{attachment_id}", status_code=204)
async def delete_attachment(attachment_id: int, db: AsyncSession = Depends(get_db)):
    att = await crud.get_attachment(db, attachment_id)
    if att is None:
        raise HTTPException(status_code=404, detail="Attachment not found.")
    file_path = settings.upload_dir / att.filename
    if file_path.exists():
        file_path.unlink()
    await crud.delete_attachment(db, attachment_id)
