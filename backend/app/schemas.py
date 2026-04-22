from datetime import date as _Date, datetime
from typing import Optional

from pydantic import BaseModel, Field, computed_field


# ── Parts ─────────────────────────────────────────────────────────────────────

class PartBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    part_number: Optional[str] = Field(default=None, max_length=100)
    brand: Optional[str] = Field(default=None, max_length=100)
    quantity: int = Field(default=1, ge=1)
    unit_cost: float = Field(default=0.0, ge=0)
    supplier: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = None


class PartCreate(PartBase):
    pass


class PartUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    part_number: Optional[str] = Field(default=None, max_length=100)
    brand: Optional[str] = Field(default=None, max_length=100)
    quantity: Optional[int] = Field(default=None, ge=1)
    unit_cost: Optional[float] = Field(default=None, ge=0)
    supplier: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = None


class Part(PartBase):
    id: int
    service_record_id: int

    @computed_field  # type: ignore[prop-decorator]
    @property
    def total_cost(self) -> float:
        return (self.quantity or 1) * (self.unit_cost or 0.0)

    model_config = {"from_attributes": True}


# ── Attachments ───────────────────────────────────────────────────────────────

class Attachment(BaseModel):
    id: int
    service_record_id: int
    filename: str
    original_filename: str
    mime_type: Optional[str]
    file_size: Optional[int]
    uploaded_at: datetime

    model_config = {"from_attributes": True}


# ── Service Records ───────────────────────────────────────────────────────────

class ServiceRecordBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    date: _Date
    mileage_at_service: Optional[int] = Field(default=None, ge=0)
    shop_name: Optional[str] = Field(default=None, max_length=200)
    labor_cost: float = Field(default=0.0, ge=0)
    labor_hours: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None


class ServiceRecordCreate(ServiceRecordBase):
    parts: list[PartCreate] = []


class ServiceRecordUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    date: Optional[_Date] = None
    mileage_at_service: Optional[int] = Field(default=None, ge=0)
    shop_name: Optional[str] = Field(default=None, max_length=200)
    labor_cost: Optional[float] = Field(default=None, ge=0)
    labor_hours: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = None
    parts: Optional[list[PartCreate]] = None


class ServiceRecord(ServiceRecordBase):
    id: int
    car_id: int
    created_at: datetime
    parts: list[Part] = []
    attachments: list[Attachment] = []

    @computed_field  # type: ignore[prop-decorator]
    @property
    def total_cost(self) -> float:
        return (self.labor_cost or 0.0) + sum(p.total_cost for p in self.parts)

    model_config = {"from_attributes": True}


# ── Scheduled Maintenance ─────────────────────────────────────────────────────

class ScheduledMaintenanceBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    due_date: Optional[_Date] = None
    due_mileage: Optional[int] = Field(default=None, ge=0)
    interval_months: Optional[int] = Field(default=None, ge=1)
    interval_km: Optional[int] = Field(default=None, ge=1)


class ScheduledMaintenanceCreate(ScheduledMaintenanceBase):
    pass


class ScheduledMaintenanceUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    due_date: Optional[_Date] = None
    due_mileage: Optional[int] = Field(default=None, ge=0)
    interval_months: Optional[int] = Field(default=None, ge=1)
    interval_km: Optional[int] = Field(default=None, ge=1)
    is_completed: Optional[bool] = None


class ScheduledMaintenance(ScheduledMaintenanceBase):
    id: int
    car_id: int
    is_completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Cars ──────────────────────────────────────────────────────────────────────

class CarBase(BaseModel):
    make: str = Field(min_length=1, max_length=50)
    model: str = Field(min_length=1, max_length=50)
    year: Optional[int] = Field(default=None, ge=1886, le=2100)
    vin: str = Field(min_length=1, max_length=17)
    license_plate: str = Field(min_length=1, max_length=20)
    color: Optional[str] = Field(default=None, max_length=30)
    owner: Optional[str] = Field(default=None, max_length=100)
    trim: Optional[str] = Field(default=None, max_length=50)
    engine: Optional[str] = Field(default=None, max_length=100)
    transmission: Optional[str] = Field(default=None, max_length=50)
    drivetrain: Optional[str] = Field(default=None, max_length=20)
    fuel_type: Optional[str] = Field(default=None, max_length=20)
    purchase_date: Optional[_Date] = None
    purchase_price: Optional[float] = Field(default=None, ge=0)
    purchase_mileage: Optional[int] = Field(default=None, ge=0)
    current_mileage: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = None
    is_archived: bool = False


class CarCreate(CarBase):
    pass


class CarUpdate(BaseModel):
    make: Optional[str] = Field(default=None, min_length=1, max_length=50)
    model: Optional[str] = Field(default=None, min_length=1, max_length=50)
    year: Optional[int] = Field(default=None, ge=1886, le=2100)
    vin: Optional[str] = Field(default=None, min_length=1, max_length=17)
    license_plate: Optional[str] = Field(default=None, min_length=1, max_length=20)
    color: Optional[str] = Field(default=None, max_length=30)
    owner: Optional[str] = Field(default=None, max_length=100)
    trim: Optional[str] = Field(default=None, max_length=50)
    engine: Optional[str] = Field(default=None, max_length=100)
    transmission: Optional[str] = Field(default=None, max_length=50)
    drivetrain: Optional[str] = Field(default=None, max_length=20)
    fuel_type: Optional[str] = Field(default=None, max_length=20)
    purchase_date: Optional[_Date] = None
    purchase_price: Optional[float] = Field(default=None, ge=0)
    purchase_mileage: Optional[int] = Field(default=None, ge=0)
    current_mileage: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = None
    is_archived: Optional[bool] = None


class Car(CarBase):
    id: int
    service_records: list[ServiceRecord] = []
    scheduled_maintenance: list[ScheduledMaintenance] = []

    model_config = {"from_attributes": True}


class CarSummary(CarBase):
    id: int
    service_count: int = 0
    total_spent: float = 0.0
    last_service_date: Optional[_Date] = None
    next_due_date: Optional[_Date] = None
