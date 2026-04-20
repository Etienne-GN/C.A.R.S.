# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**C.A.R.S. — Cars Archive of Repairs and Services**

A full-stack web app for managing a personal garage. The repo also contains a legacy static file (`index.html`) that is an interactive VW Jetta 2011 fuse box diagram — unrelated to the main app.

## Architecture

```
backend/   FastAPI + SQLAlchemy (async) + SQLite
frontend/  React 19 + TypeScript + Vite
```

### Backend (`backend/`)

- **Framework**: FastAPI with async SQLAlchemy (`aiosqlite` driver)
- **Entry point**: `backend/app/main.py` — creates DB tables on startup, registers routes
- **Layers**: `models.py` (SQLAlchemy ORM) → `schemas.py` (Pydantic) → `crud.py` (DB queries) → `main.py` (routes)
- **DB config**: `backend/app/config.py` reads `DATABASE_URL` from `.env`; defaults to `sqlite+aiosqlite:///./cars.db`
- No migrations tool yet — schema is created from models at startup

### Frontend (`frontend/`)

- **Router**: `App.tsx` — three routes: `/` (HomePage), `/cars` (CarListPage), `/cars/:carId` (CarDetailPage)
- **API calls**: axios, hardcoded base URL `http://localhost:8000` in page components
- **Types**: `src/types/car.ts` — `Car` and `CarCreate` interfaces mirror backend Pydantic schemas

## Commands

### Backend

```bash
cd backend
pip install fastapi uvicorn sqlalchemy aiosqlite pydantic-settings
uvicorn app.main:app --reload        # dev server on :8000
```

No `requirements.txt` exists yet — install deps manually.

### Frontend

```bash
cd frontend
npm install
npm run dev      # dev server on :5173
npm run build    # type-check + Vite build
npm run lint     # ESLint
```
