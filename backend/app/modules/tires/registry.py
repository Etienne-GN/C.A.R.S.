from fastapi import FastAPI

from app.modules.tires import models as tire_models  # noqa: F401
from app.modules.tires.router import router


def register_routes(app: FastAPI) -> None:
    app.include_router(router)
