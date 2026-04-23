from fastapi import FastAPI

from app.modules.logbook import models as logbook_models  # noqa: F401
from app.modules.logbook.router import router


def register_routes(app: FastAPI) -> None:
    app.include_router(router)
