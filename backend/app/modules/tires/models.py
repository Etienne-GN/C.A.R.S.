from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class TireSet(Base):
    __tablename__ = "tire_sets"

    id = Column(Integer, primary_key=True, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    brand = Column(String(100))
    model = Column(String(100))
    size = Column(String(30))
    season = Column(String(20))  # summer, winter, all-season
    installed_date = Column(Date)
    installed_odometer = Column(Integer)
    notes = Column(String(500))

    tread_readings = relationship("TreadReading", back_populates="tire_set", cascade="all, delete-orphan", order_by="TreadReading.date.desc()")
    car = relationship("Car")


class TreadReading(Base):
    __tablename__ = "tread_readings"

    id = Column(Integer, primary_key=True, index=True)
    tire_set_id = Column(Integer, ForeignKey("tire_sets.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    odometer = Column(Integer)
    fl = Column(Float)
    fr = Column(Float)
    rl = Column(Float)
    rr = Column(Float)

    tire_set = relationship("TireSet", back_populates="tread_readings")
