from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from .config import settings
from .database import engine
from . import models, module_manager
from .modules.fuel import models as fuel_models  # noqa: F401 — registers table with Base
from .modules.tires import models as tire_models  # noqa: F401 — registers table with Base
from .modules.logbook import models as logbook_models  # noqa: F401 — registers table with Base
from .routers import cars, services, maintenance, modules, notes


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)

    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

        # Migrate: add new columns to cars table if upgrading from v1
        result = await conn.execute(text("PRAGMA table_info(cars)"))
        existing = {row[1] for row in result}
        new_columns = [
            ("trim", "VARCHAR(50)"),
            ("engine", "VARCHAR(100)"),
            ("transmission", "VARCHAR(50)"),
            ("drivetrain", "VARCHAR(20)"),
            ("fuel_type", "VARCHAR(20)"),
            ("purchase_date", "DATE"),
            ("purchase_price", "REAL"),
            ("purchase_mileage", "INTEGER"),
            ("current_mileage", "INTEGER"),
            ("notes", "TEXT"),
            ("is_archived", "BOOLEAN DEFAULT 0 NOT NULL"),
        ]
        for col, col_type in new_columns:
            if col not in existing:
                await conn.execute(text(f"ALTER TABLE cars ADD COLUMN {col} {col_type}"))

        new_columns_cars_v2 = [
            ("photo_filename", "VARCHAR(255)"),
            ("horsepower", "INTEGER"),
            ("torque_lbft", "INTEGER"),
            ("zero_to_100_s", "REAL"),
            ("top_speed_kmh", "INTEGER"),
            ("weight_kg", "INTEGER"),
            ("fuel_city", "VARCHAR(20)"),
            ("fuel_highway", "VARCHAR(20)"),
            ("fuel_tank_l", "REAL"),
            ("oil_capacity_l", "REAL"),
            ("oil_type", "VARCHAR(20)"),
            ("coolant_capacity_l", "REAL"),
            ("tire_size_summer", "VARCHAR(30)"),
            ("tire_size_winter", "VARCHAR(30)"),
            ("front_disk_mm", "INTEGER"),
            ("rear_disk_mm", "INTEGER"),
        ]
        for col, col_type in new_columns_cars_v2:
            if col not in existing:
                await conn.execute(text(f"ALTER TABLE cars ADD COLUMN {col} {col_type}"))

        new_columns_cars_v3 = [
            ("doors", "INTEGER"),
            ("body_class", "VARCHAR(50)"),
            ("cylinders", "INTEGER"),
            ("displacement_l", "REAL"),
            ("plant_country", "VARCHAR(50)"),
        ]
        for col, col_type in new_columns_cars_v3:
            if col not in existing:
                await conn.execute(text(f"ALTER TABLE cars ADD COLUMN {col} {col_type}"))

        result = await conn.execute(text("PRAGMA table_info(service_records)"))
        sr_existing = {row[1] for row in result}
        if "labor_hours" not in sr_existing:
            await conn.execute(text("ALTER TABLE service_records ADD COLUMN labor_hours REAL DEFAULT 0.0"))

    yield  # car_notes table created by create_all above

    await engine.dispose()


app = FastAPI(title="C.A.R.S. — Cars Archive of Repairs and Services", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cars.router)
app.include_router(services.router)
app.include_router(maintenance.router)
app.include_router(modules.router)
app.include_router(notes.router)

module_manager.register_module_routes(app)

settings.upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.upload_dir)), name="uploads")


@app.get("/")
async def root():
    return {"message": "C.A.R.S. — Cars Archive of Repairs and Services"}
