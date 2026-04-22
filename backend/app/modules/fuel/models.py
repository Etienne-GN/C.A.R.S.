from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    odometer = Column(Integer, nullable=False)
    litres = Column(Float, nullable=False)
    price_per_litre = Column(Float, nullable=False)
    station = Column(String(200))
    full_tank = Column(Integer, default=1)

    car = relationship("Car")
