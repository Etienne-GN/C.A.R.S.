from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .. import module_manager
from ..database import get_db
from ..models import ModuleStatus

router = APIRouter(prefix="/modules", tags=["modules"])


class ModuleToggle(BaseModel):
    is_enabled: bool


async def _enabled_keys(db: AsyncSession) -> set[str]:
    result = await db.execute(select(ModuleStatus))
    return {row.key for row in result.scalars().all() if row.is_enabled}


@router.get("/")
async def list_modules(db: AsyncSession = Depends(get_db)):
    enabled = _enabled_keys_sync := await _enabled_keys(db)
    return [
        {**asdict(m), "is_enabled": m.key in enabled}
        for m in module_manager.get_modules()
    ]


@router.patch("/{key}")
async def update_module(key: str, body: ModuleToggle, db: AsyncSession = Depends(get_db)):
    if module_manager.get_module(key) is None:
        raise HTTPException(status_code=404, detail="Module not found")

    status = await db.get(ModuleStatus, key)
    if status is None:
        status = ModuleStatus(key=key, is_enabled=body.is_enabled)
        db.add(status)
    else:
        status.is_enabled = body.is_enabled
    await db.commit()

    module = module_manager.get_module(key)
    return {**asdict(module), "is_enabled": body.is_enabled}
