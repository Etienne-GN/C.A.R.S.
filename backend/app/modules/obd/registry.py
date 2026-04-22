from fastapi import FastAPI
from app.modules.obd.router import router


def register_routes(app: FastAPI) -> None:
    app.include_router(router)
