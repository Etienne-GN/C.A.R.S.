from pydantic import BaseModel, Field


class CarBase(BaseModel):
    make: str = Field(min_length=1, max_length=50)
    model: str = Field(min_length=1, max_length=50)
    year: int = Field(ge=1886, le=2100)
    vin: str = Field(min_length=1, max_length=17)
    license_plate: str = Field(min_length=1, max_length=20)
    color: str = Field(min_length=1, max_length=30)
    owner: str = Field(min_length=1, max_length=100)


class CarCreate(CarBase):
    pass


class CarUpdate(BaseModel):
    make: str | None = Field(default=None, min_length=1, max_length=50)
    model: str | None = Field(default=None, min_length=1, max_length=50)
    year: int | None = Field(default=None, ge=1886, le=2100)
    vin: str | None = Field(default=None, min_length=1, max_length=17)
    license_plate: str | None = Field(default=None, min_length=1, max_length=20)
    color: str | None = Field(default=None, min_length=1, max_length=30)
    owner: str | None = Field(default=None, min_length=1, max_length=100)


class Car(CarBase):
    id: int

    model_config = {"from_attributes": True}
