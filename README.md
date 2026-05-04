# Pokemon Explorer

A full-stack Pokémon collection and battle system. Browse the Pokédex, build a collection, and pit your Pokémon against each other in turn-based battles with an animated replay.

## Structure

```
pokemon-app/
├── frontend/     Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
├── backend/      FastAPI, MongoDB, Redis
└── docker-compose.yml
```

---

## Quick Start (Docker)

```bash
docker-compose up -d
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |
| MongoDB UI | http://localhost:8081 |

## Local Dev (without Docker)

Requires MongoDB and Redis already running locally.

**Frontend**
```bash
cd frontend
pnpm install
pnpm dev          # http://localhost:3000
```

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000
```

## Environment Variables

**Frontend** — copy `frontend/.env.example` to `frontend/.env.local`:

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend base URL (browser-side requests) |
| `INTERNAL_API_URL` | — | Backend base URL for server-side Next.js route handlers (e.g. `http://backend:8000` in Docker) |

**Backend** — set in `docker-compose.yml` or a `.env` file at the repo root:

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `DATABASE_NAME` | `pokemon_db` | Database name |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `LOG_LEVEL` | `INFO` | Logging level |

---

## Features

**Pokédex** — paginated, searchable grid of all Pokémon. Infinite-scroll loads 20 at a time. Click any card to see full stats, description, height/weight, and generation. Pokémon already in your collection are visually highlighted.

**Collection** — catch and release Pokémon. Each user's collection is persisted in MongoDB and restored on page load.

**Battles** — select two owned Pokémon from the Pokédex in Battle Mode and start a fight. Battles are queued, processed asynchronously, and then replayed turn-by-turn in an animated arena view with live HP bars, a turn log, and a winner banner.

**Battle History** — responsive table of all past battles with Pokémon sprites, outcome, date, and a link to replay any fight.

---

## API Reference

Full interactive docs available at `http://localhost:8000/docs`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/pokemon` | List all Pokémon |
| `POST` | `/users` | Create a user (idempotent by name) |
| `GET` | `/users/{id}` | Get user |
| `GET` | `/users/{id}/collection` | List owned Pokémon |
| `POST` | `/users/{id}/collection` | Catch a Pokémon `{"pokemon_id": 1}` |
| `DELETE` | `/users/{id}/collection/{pokemon_id}` | Release a Pokémon |
| `POST` | `/battles` | Initiate a battle — returns `battle_id` (202, idempotent) |
| `GET` | `/battles` | Paginated battle history |
| `GET` | `/battles/{id}` | Battle detail with full turn log |

---

## Tech Choices & Reasoning

**Redis as a battle queue** — `POST /battles` pushes the battle ID onto a Redis list and returns 202 immediately. A background worker polls the queue, acquires a distributed lock (`SET NX EX`) per battle to prevent double-processing, computes all turns, and writes them atomically to MongoDB. This keeps the API responsive and makes the worker crash-safe: if it dies mid-battle, the lock expires and the battle is retried.

**`asyncio.to_thread` for the worker** — battle computation is synchronous (MongoEngine calls + math). Running it on the thread-pool via `asyncio.to_thread` prevents it from blocking the event loop during heavy fights.

**Polling over SSE** — the battle worker computes all turns in a single pass. Streaming them would require either a step-per-tick worker loop or re-querying the DB on each push. Frontend polling at 1 s intervals is simpler and equally responsive for typical battle lengths; an SSE endpoint remains a straightforward follow-up.

---

## Assumptions

- **Anonymous users.** A user is auto-created on first page load with a random name; the ID is stored in `localStorage`. No login is required.
- **Ownership required for battles.** Both Pokémon must be in the requesting user's collection (403 otherwise).
- **Idempotent battle creation.** Re-submitting the same pair while a battle is `pending` or `in_progress` returns the existing `battle_id` rather than creating a duplicate.
- **Static Pokémon roster.** Data is seeded from `backend/data/pokemon.json` at startup and never modified at runtime.
- **Physical vs. special damage.** Each turn uses whichever is higher — `attack − defense` or `special_attack − special_defense` — plus `random(1, 10)`, clamped to a minimum of 1. This prevents high-defense Pokémon from being completely immune to damage.

---

## What I'd Improve With More Time

See the open issues.
