from dataclasses import asdict

from fastapi import APIRouter

from .. import module_manager

router = APIRouter(prefix="/modules", tags=["modules"])


@router.get("/")
async def list_modules():
    return [asdict(m) for m in module_manager.get_modules()]
