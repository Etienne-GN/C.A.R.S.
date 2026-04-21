from datetime import date as date_type

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from . import models, schemas


# ── Cars ──────────────────────────────────────────────────────────────────────

def _car_with_all():
    return (
        select(models.Car)
        .options(
            selectinload(models.Car.service_records)
            .selectinload(models.ServiceRecord.parts),
            selectinload(models.Car.service_records)
            .selectinload(models.ServiceRecord.attachments),
            selectinload(models.Car.scheduled_maintenance),
        )
    )


async def get_cars_summary(db: AsyncSession) -> list[schemas.CarSummary]:
    result = await db.execute(
        select(models.Car)
        .options(
            selectinload(models.Car.service_records).selectinload(models.ServiceRecord.parts),
            selectinload(models.Car.scheduled_maintenance),
        )
    )
    cars = result.scalars().all()
    summaries = []
    for car in cars:
        total_spent = sum(
            (sr.labor_cost or 0) + sum((p.quantity or 1) * (p.unit_cost or 0) for p in sr.parts)
            for sr in car.service_records
        )
        last_service = max((sr.date for sr in car.service_records), default=None)
        pending = [sm for sm in car.scheduled_maintenance if not sm.is_completed and sm.due_date]
        next_due = min((sm.due_date for sm in pending), default=None)

        summaries.append(schemas.CarSummary(
            **{c.key: getattr(car, c.key) for c in models.Car.__table__.columns},
            service_count=len(car.service_records),
            total_spent=round(total_spent, 2),
            last_service_date=last_service,
            next_due_date=next_due,
        ))
    return summaries


async def get_car(db: AsyncSession, car_id: int) -> models.Car | None:
    result = await db.execute(_car_with_all().where(models.Car.id == car_id))
    return result.scalars().first()


async def create_car(db: AsyncSession, car: schemas.CarCreate) -> models.Car:
    db_car = models.Car(**car.model_dump())
    db.add(db_car)
    await db.commit()
    await db.refresh(db_car)
    return await get_car(db, db_car.id)  # type: ignore[return-value]


async def update_car(db: AsyncSession, car_id: int, car: schemas.CarUpdate) -> models.Car | None:
    result = await db.execute(select(models.Car).where(models.Car.id == car_id))
    db_car = result.scalars().first()
    if db_car is None:
        return None
    for key, value in car.model_dump(exclude_unset=True).items():
        setattr(db_car, key, value)
    await db.commit()
    return await get_car(db, car_id)


async def delete_car(db: AsyncSession, car_id: int) -> models.Car | None:
    result = await db.execute(select(models.Car).where(models.Car.id == car_id))
    db_car = result.scalars().first()
    if db_car is None:
        return None
    await db.delete(db_car)
    await db.commit()
    return db_car


# ── Service Records ───────────────────────────────────────────────────────────

def _service_with_all():
    return (
        select(models.ServiceRecord)
        .options(
            selectinload(models.ServiceRecord.parts),
            selectinload(models.ServiceRecord.attachments),
        )
    )


async def get_service_records(db: AsyncSession, car_id: int) -> list[models.ServiceRecord]:
    result = await db.execute(
        _service_with_all()
        .where(models.ServiceRecord.car_id == car_id)
        .order_by(models.ServiceRecord.date.desc())
    )
    return list(result.scalars().all())


async def get_service_record(db: AsyncSession, service_id: int) -> models.ServiceRecord | None:
    result = await db.execute(_service_with_all().where(models.ServiceRecord.id == service_id))
    return result.scalars().first()


async def create_service_record(
    db: AsyncSession, car_id: int, record: schemas.ServiceRecordCreate
) -> models.ServiceRecord:
    data = record.model_dump(exclude={"parts"})
    db_record = models.ServiceRecord(car_id=car_id, **data)
    for part_data in record.parts:
        db_record.parts.append(models.Part(**part_data.model_dump()))
    db.add(db_record)
    await db.commit()
    await db.refresh(db_record)
    return await get_service_record(db, db_record.id)  # type: ignore[return-value]


async def update_service_record(
    db: AsyncSession, service_id: int, record: schemas.ServiceRecordUpdate
) -> models.ServiceRecord | None:
    result = await db.execute(select(models.ServiceRecord).where(models.ServiceRecord.id == service_id))
    db_record = result.scalars().first()
    if db_record is None:
        return None
    for key, value in record.model_dump(exclude_unset=True).items():
        setattr(db_record, key, value)
    await db.commit()
    return await get_service_record(db, service_id)


async def delete_service_record(db: AsyncSession, service_id: int) -> models.ServiceRecord | None:
    result = await db.execute(select(models.ServiceRecord).where(models.ServiceRecord.id == service_id))
    db_record = result.scalars().first()
    if db_record is None:
        return None
    await db.delete(db_record)
    await db.commit()
    return db_record


# ── Parts ─────────────────────────────────────────────────────────────────────

async def create_part(db: AsyncSession, service_id: int, part: schemas.PartCreate) -> models.Part:
    db_part = models.Part(service_record_id=service_id, **part.model_dump())
    db.add(db_part)
    await db.commit()
    await db.refresh(db_part)
    return db_part


async def update_part(db: AsyncSession, part_id: int, part: schemas.PartUpdate) -> models.Part | None:
    result = await db.execute(select(models.Part).where(models.Part.id == part_id))
    db_part = result.scalars().first()
    if db_part is None:
        return None
    for key, value in part.model_dump(exclude_unset=True).items():
        setattr(db_part, key, value)
    await db.commit()
    await db.refresh(db_part)
    return db_part


async def delete_part(db: AsyncSession, part_id: int) -> models.Part | None:
    result = await db.execute(select(models.Part).where(models.Part.id == part_id))
    db_part = result.scalars().first()
    if db_part is None:
        return None
    await db.delete(db_part)
    await db.commit()
    return db_part


# ── Attachments ───────────────────────────────────────────────────────────────

async def create_attachment(db: AsyncSession, service_id: int, **kwargs) -> models.Attachment:
    db_att = models.Attachment(service_record_id=service_id, **kwargs)
    db.add(db_att)
    await db.commit()
    await db.refresh(db_att)
    return db_att


async def get_attachment(db: AsyncSession, attachment_id: int) -> models.Attachment | None:
    result = await db.execute(select(models.Attachment).where(models.Attachment.id == attachment_id))
    return result.scalars().first()


async def delete_attachment(db: AsyncSession, attachment_id: int) -> models.Attachment | None:
    result = await db.execute(select(models.Attachment).where(models.Attachment.id == attachment_id))
    db_att = result.scalars().first()
    if db_att is None:
        return None
    await db.delete(db_att)
    await db.commit()
    return db_att


# ── Scheduled Maintenance ─────────────────────────────────────────────────────

async def get_scheduled_maintenance(db: AsyncSession, car_id: int) -> list[models.ScheduledMaintenance]:
    result = await db.execute(
        select(models.ScheduledMaintenance)
        .where(models.ScheduledMaintenance.car_id == car_id)
        .order_by(models.ScheduledMaintenance.due_date.asc().nulls_last())
    )
    return list(result.scalars().all())


async def create_scheduled_maintenance(
    db: AsyncSession, car_id: int, item: schemas.ScheduledMaintenanceCreate
) -> models.ScheduledMaintenance:
    db_item = models.ScheduledMaintenance(car_id=car_id, **item.model_dump())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item


async def update_scheduled_maintenance(
    db: AsyncSession, item_id: int, item: schemas.ScheduledMaintenanceUpdate
) -> models.ScheduledMaintenance | None:
    result = await db.execute(
        select(models.ScheduledMaintenance).where(models.ScheduledMaintenance.id == item_id)
    )
    db_item = result.scalars().first()
    if db_item is None:
        return None
    for key, value in item.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    await db.commit()
    await db.refresh(db_item)
    return db_item


async def delete_scheduled_maintenance(db: AsyncSession, item_id: int) -> models.ScheduledMaintenance | None:
    result = await db.execute(
        select(models.ScheduledMaintenance).where(models.ScheduledMaintenance.id == item_id)
    )
    db_item = result.scalars().first()
    if db_item is None:
        return None
    await db.delete(db_item)
    await db.commit()
    return db_item
