from fastapi import FastAPI

from app.modules.fuel import models as fuel_models
from app.database import Base, engine
from app.modules.fuel.router import router


def register_routes(app: FastAPI) -> None:
    app.include_router(router)
