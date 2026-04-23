from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class TripLog(Base):
    __tablename__ = "trip_logs"

    id = Column(Integer, primary_key=True, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    start_location = Column(String(200))
    end_location = Column(String(200))
    distance_km = Column(Float, nullable=False)
    duration_min = Column(Integer)
    purpose = Column(String(100))
    fuel_cost = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
