from sqlalchemy import Column, Integer, String
from .database import Base

class Car(Base):
    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    make = Column(String, index=True)
    model = Column(String, index=True)
    year = Column(Integer)
    vin = Column(String, unique=True, index=True)
    license_plate = Column(String, unique=True, index=True)
    color = Column(String)
    owner = Column(String)
