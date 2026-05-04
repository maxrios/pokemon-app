# interview-api - Agent Instructions

## What this project is

A Pokemon collection and battle system backend API, built as an interview assignment. It exposes REST endpoints for managing a user's Pokemon collection and running turn-based battles with real-time SSE streaming.

## Stack

| Layer       | Choice                                    |
| ----------- | ----------------------------------------- |
| Language    | Python 3.11                               |
| Framework   | FastAPI 0.104.1                           |
| Database    | MongoDB 7.0 via MongoEngine               |
| Cache       | Redis 7.2                                 |
| Validation  | Pydantic v2                               |
| HTTP client | httpx                                     |
| Testing     | pytest + pytest-asyncio                   |
| Container   | Docker + docker-compose                   |

## Key design decisions

**Singleton connections for MongoDB and Redis.** `database.py` manages a single shared connection; import it rather than opening new connections per request.

**Settings via environment variables.** `settings.py` is a singleton that reads `MONGODB_URL`, `DATABASE_NAME`, `REDIS_URL`, `LOG_LEVEL`, `API_HOST`, `API_PORT`. Never hardcode connection strings.

**MongoEngine for ODM.** Models in `models.py` extend `Document`. Add new collections there; do not mix raw PyMongo calls with MongoEngine documents in the same layer.

**Pydantic models in `main.py` for request/response.** Keep MongoEngine documents (storage) separate from Pydantic models (API contract). Convert at the route layer.

**SSE for real-time battle streaming.** Use FastAPI's `StreamingResponse` with an async generator; handle client disconnection inside the generator.

## Project structure

```
main.py              - FastAPI app, routes, Pydantic request/response models
models.py            - MongoEngine document models (storage layer)
database.py          - MongoDB + Redis connection management (singleton)
settings.py          - Config singleton (reads env vars)
requirements.txt     - Python dependencies
Dockerfile           - Container image definition
docker-compose.yml   - Multi-service orchestration (app, MongoDB, Redis, mongo-express)
```

## Scripts

| Command                          | When to run                                      |
| -------------------------------- | ------------------------------------------------ |
| `docker-compose up -d`           | Start full stack (app + MongoDB + Redis)         |
| `uvicorn main:app --reload`      | Local dev server (requires MongoDB + Redis)      |
| `pytest`                         | Run test suite                                   |
| `black . --check`                | Formatting check (CI-gated)                      |
| `black .`                        | Apply formatting                                 |
| `ruff check .`                   | Lint (CI-gated, warnings are errors)             |

---

## Development workflow

> **IMPORTANT:** For any code change, bug fix, or new feature — always execute the steps below without being explicitly asked. Do not write any code before completing steps 1–3 (find parent node, branch, create node).

This project tracks its own development using `memex`. Follow this pattern for every feature or fix:

1. **Find a parent node** - Choose the parent based on what your work _depends on_, not just what is most recent:
   - `memex graph` - visualize the current DAG to see branching structure
   - `memex node list` - shows all nodes with IDs, parent IDs, statuses, git refs, and one-line goals
   - `memex search <keyword>` - full-text search across node summaries; use domain terms (e.g. `collection`, `battle`, `streaming`) to surface related prior work
   - If your work extends a specific prior feature, attach to that feature's node even if it isn't the tip
   - If your work is independent of recent changes, find the most recent resolved node whose scope your work builds on
   - If your work depends directly on what just landed, attach to the active node (the linear case, correct when the dependency is real)
   - e.g. adding tests for the battle endpoint → parent is the node that implemented battles, not documentation or cleanup nodes that landed after it
   - e.g. fixing a crash in SSE streaming → parent is the node that introduced streaming, not whatever resolved most recently

2. **Branch** - `git checkout -b <type>/<name>` from `main` (e.g. `fix/battle-sse-disconnect`, `feat/collection-endpoints`, `test/battle-roundtrip`, `chore/cleanup-models`).

3. **Node** - `memex node create --parent <parent-id> --goal "<your goal here>"` before writing any code. Use the real goal if you already know it; a short placeholder is fine when the scope is still uncertain.

4. **Implement** the feature. Non-trivial changes to routes, models, or database logic should come with tests — prefer integration tests that hit a real (test) database for CLI-visible behavior, inline unit tests for pure logic.

5. **Summarize** - Record as you go, not after. For every `--decision` you record, ask: _what alternative did I deliberately not take, and why?_ If there's an answer, that's a `--rejected`. Before resolving, ask: _what question did I defer, what caveat did I notice, what did I leave for later?_ Each one is an `--open-thread`. These two fields are under-used; using them gives future agents (and future-you) the context that decisions alone don't capture.

   ```
   memex node edit --decision "chose X over Y because Z"
   memex node edit --artifact "path/to/key/file.py"
   memex node edit --open-thread "question to revisit later"
   memex node edit --rejected $'description = "Alternative approach"\nreason = "Why rejected"'
   memex node edit --goal "Updated goal if scope changed"
   ```

   Each flag appends to (or overwrites for `--goal`) the current node without touching other fields.
   Use `--summary` only for a full bulk replacement (e.g. bootstrapping from a plan).

6. **Resolve or abandon** - Run `black . --check`, `ruff check .`, and `pytest` locally; all three must pass. Then `memex node resolve` when the work is complete. If the task is superseded or turns out to be the wrong approach, use `memex node abandon` with a note in the summary explaining why.

7. **Commit** - Commit source changes and `.memex/nodes/` together — they describe the same unit of work. Never commit `.memex/state.json`: it's per-developer working-node state and will create merge conflicts. Documentation updates (AGENTS.md, README.md) go in a separate commit so the source diff and doc diff are independently reviewable.

8. **Push** and open a PR.

   PR description template:

   ```markdown
   ## Summary

   - 2–5 bullets: what changed and why

   ## Test plan

   - Checklist of verification steps (commands to run, expected output)
   ```

   Title ends with `(closes #N)` when the PR resolves an issue. Branch names follow `<type>/<name>`.

## Documentation hygiene

After implementing any change, check whether it affects user-visible behavior, API contract, or workflow guidance:

- If **AGENTS.md** describes the changed behavior (commands, structure, workflow steps), update it.
- If **README.md** documents the changed endpoint or setup, update it.

Always make documentation updates a **separate commit** from the source change.
