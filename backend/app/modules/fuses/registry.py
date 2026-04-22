from fastapi import FastAPI

from .router import router


def register_routes(app: FastAPI) -> None:
    app.include_router(router)
