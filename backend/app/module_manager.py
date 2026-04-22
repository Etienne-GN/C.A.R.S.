import importlib
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from fastapi import FastAPI

logger = logging.getLogger(__name__)

MODULES_DIR = Path(__file__).parent / "modules"


@dataclass
class ModuleDefinition:
    key: str
    title: str
    icon: str
    description: str
    route: str


_MODULES: dict[str, ModuleDefinition] = {}


def load_modules() -> dict[str, ModuleDefinition]:
    modules: dict[str, ModuleDefinition] = {}
    if not MODULES_DIR.exists():
        return modules

    for entry in sorted(MODULES_DIR.iterdir()):
        if not entry.is_dir() or entry.name.startswith("_"):
            continue
        manifest_path = entry / "manifest.json"
        if not manifest_path.exists():
            continue
        try:
            data = json.loads(manifest_path.read_text())
            modules[data["key"]] = ModuleDefinition(
                key=data["key"],
                title=data["title"],
                icon=data["icon"],
                description=data["description"],
                route=data.get("route", f"/modules/{data['key']}"),
            )
        except Exception as e:
            logger.error("Failed to load manifest for %s: %s", entry.name, e)
    return modules


def register_module_routes(app: FastAPI) -> None:
    global _MODULES
    _MODULES = load_modules()

    for key in _MODULES:
        try:
            registry = importlib.import_module(f"app.modules.{key}.registry")
            if hasattr(registry, "register_routes"):
                registry.register_routes(app)
                logger.info("Registered routes for module: %s", key)
        except Exception as e:
            logger.error("Failed to register routes for module %s: %s", key, e)


def get_modules() -> list[ModuleDefinition]:
    return list(_MODULES.values())


def get_module(key: str) -> Optional[ModuleDefinition]:
    return _MODULES.get(key)
