from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class Car(Base):
    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    make = Column(String(50), index=True, nullable=False)
    model = Column(String(50), index=True, nullable=False)
    year = Column(Integer, nullable=False)
    vin = Column(String(17), unique=True, index=True, nullable=False)
    license_plate = Column(String(20), unique=True, index=True, nullable=False)
    color = Column(String(30))
    owner = Column(String(100))
    trim = Column(String(50))
    engine = Column(String(100))
    transmission = Column(String(50))
    drivetrain = Column(String(20))
    fuel_type = Column(String(20))
    purchase_date = Column(Date)
    purchase_price = Column(Float)
    purchase_mileage = Column(Integer)
    current_mileage = Column(Integer)
    notes = Column(Text)
    is_archived = Column(Boolean, default=False, nullable=False)
    photo_filename = Column(String(255))

    # Performance
    horsepower = Column(Integer)
    torque_lbft = Column(Integer)
    zero_to_100_s = Column(Float)
    top_speed_kmh = Column(Integer)
    weight_kg = Column(Integer)

    # Fuel economy
    fuel_city = Column(String(20))
    fuel_highway = Column(String(20))
    fuel_tank_l = Column(Float)

    # Fluids
    oil_capacity_l = Column(Float)
    oil_type = Column(String(20))
    coolant_capacity_l = Column(Float)

    # Tires & Brakes
    tire_size_summer = Column(String(30))
    tire_size_winter = Column(String(30))
    front_disk_mm = Column(Integer)
    rear_disk_mm = Column(Integer)

    service_records = relationship("ServiceRecord", back_populates="car", cascade="all, delete-orphan", order_by="ServiceRecord.date.desc()")
    scheduled_maintenance = relationship("ScheduledMaintenance", back_populates="car", cascade="all, delete-orphan")
    car_notes = relationship("CarNote", back_populates="car", cascade="all, delete-orphan", order_by="CarNote.created_at.desc()")


class ServiceRecord(Base):
    __tablename__ = "service_records"

    id = Column(Integer, primary_key=True, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    date = Column(Date, nullable=False)
    mileage_at_service = Column(Integer)
    shop_name = Column(String(200))
    labor_cost = Column(Float, default=0.0)
    labor_hours = Column(Float, default=0.0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    car = relationship("Car", back_populates="service_records")
    parts = relationship("Part", back_populates="service_record", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="service_record", cascade="all, delete-orphan")


class Part(Base):
    __tablename__ = "parts"

    id = Column(Integer, primary_key=True, index=True)
    service_record_id = Column(Integer, ForeignKey("service_records.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    part_number = Column(String(100))
    brand = Column(String(100))
    quantity = Column(Integer, default=1)
    unit_cost = Column(Float, default=0.0)
    supplier = Column(String(200))
    notes = Column(Text)

    service_record = relationship("ServiceRecord", back_populates="parts")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    service_record_id = Column(Integer, ForeignKey("service_records.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100))
    file_size = Column(Integer)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    service_record = relationship("ServiceRecord", back_populates="attachments")


class ScheduledMaintenance(Base):
    __tablename__ = "scheduled_maintenance"

    id = Column(Integer, primary_key=True, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    due_date = Column(Date)
    due_mileage = Column(Integer)
    interval_months = Column(Integer)
    interval_km = Column(Integer)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    car = relationship("Car", back_populates="scheduled_maintenance")


class CarNote(Base):
    __tablename__ = "car_notes"

    id = Column(Integer, primary_key=True, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    body = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    car = relationship("Car", back_populates="car_notes")


class ModuleStatus(Base):
    __tablename__ = "module_statuses"

    key = Column(String(50), primary_key=True)
    is_enabled = Column(Boolean, default=False, nullable=False)
