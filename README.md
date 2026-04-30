# Pokemon App

A Pokemon collection and battle system — Next.js frontend + FastAPI backend in a single monorepo.

## Structure

```
pokemon-app/
├── frontend/     Next.js 15, TypeScript, Tailwind, shadcn/ui
├── backend/      FastAPI, MongoDB, Redis
└── docker-compose.yml
```

## Quick start (Docker)

```bash
docker-compose up -d
```

| Service        | URL                     |
|----------------|-------------------------|
| Frontend       | http://localhost:3000   |
| Backend API    | http://localhost:8000   |
| API docs       | http://localhost:8000/docs |
| MongoDB UI     | http://localhost:8081   |

## Local dev (without Docker)

**Frontend**
```bash
cd frontend
pnpm install
pnpm dev          # http://localhost:3000
```

**Backend** (requires MongoDB + Redis running)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000
```

## Environment variables

Copy `frontend/.env.example` to `frontend/.env.local` and adjust as needed.

| Variable               | Default                  | Description                  |
|------------------------|--------------------------|------------------------------|
| `NEXT_PUBLIC_API_URL`  | `http://localhost:8000`  | FastAPI backend base URL     |

Backend env vars are set in `docker-compose.yml` and can be overridden via a `.env` file at the repo root.
