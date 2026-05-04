import asyncio
import logging
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from mongoengine.errors import NotUniqueError
from pydantic import BaseModel

from battle_service import run_battle_worker
from database import get_redis_client, initialize_database, close_database_connection
from models import BattleHistory, BattleTurn, Ownership
from models import Pokemon as PokemonDoc
from models import User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# =============================================================================
# Pydantic Models (Request/Response schemas)
# =============================================================================


class PokemonResponse(BaseModel):
    id: str
    pokemon_id: int
    name: str
    types: List[str]
    hp: int
    attack: int
    defense: int
    special_attack: int
    special_defense: int
    speed: int
    description: str
    generation: int
    height: float
    weight: float
    image_url: str


class UserResponse(BaseModel):
    id: str
    name: str


class CatchRequest(BaseModel):
    pokemon_id: int


class CollectionEntry(BaseModel):
    ownership_id: str
    caught_at: str
    pokemon: PokemonResponse


class BattleRequest(BaseModel):
    user_id: str
    pokemon_one_id: str
    pokemon_two_id: str


class BattleResponse(BaseModel):
    battle_id: str


class BattleTurnResponse(BaseModel):
    turn_number: int
    first_attacker_id: str
    damage_to_pokemon_one: int
    damage_to_pokemon_two: int
    battle_over: bool


class BattleSummary(BaseModel):
    battle_id: str
    trainer_id: str
    status: str
    started_at: str
    ended_at: Optional[str]
    pokemon_one: PokemonResponse
    pokemon_two: PokemonResponse
    winner_id: Optional[str]


class BattleDetail(BattleSummary):
    turns: List[BattleTurnResponse]


# =============================================================================
# Application Setup
# =============================================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    initialize_database()
    worker_task = asyncio.create_task(run_battle_worker())
    logger.info("Application startup complete")
    yield
    # Shutdown
    worker_task.cancel()
    close_database_connection()
    logger.info("Application shutdown complete")


app = FastAPI(
    title="Pokemon Explorer API",
    description="Backend service for Pokemon collection management and battles",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Health Check Endpoints
# =============================================================================


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Pokemon Explorer API is running", "status": "healthy"}


@app.get("/health")
async def health_check():
    """Detailed health check."""
    # TODO: Add database connectivity check
    return {
        "status": "healthy",
        "message": "All systems operational",
    }


# =============================================================================
# Helpers
# =============================================================================


def _pokemon_response(p: PokemonDoc) -> PokemonResponse:
    return PokemonResponse(
        id=str(p.id),
        pokemon_id=p.pokemon_id,
        name=p.name,
        types=p.types,
        hp=p.hp,
        attack=p.attack,
        defense=p.defense,
        special_attack=p.special_attack,
        special_defense=p.special_defense,
        speed=p.speed,
        description=p.description,
        generation=p.generation,
        height=p.height,
        weight=p.weight,
        image_url=p.image_url,
    )


def _get_user_or_404(user_id: str) -> User:
    user = User.objects(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# =============================================================================
# Pokemon Endpoints
# =============================================================================


@app.get("/pokemon", response_model=List[PokemonResponse])
async def list_pokemon():
    return [_pokemon_response(p) for p in PokemonDoc.objects()]


# =============================================================================
# User Endpoints
# =============================================================================


@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(body: dict):
    name = body.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=422, detail="name is required")
    try:
        user = User(name=name).save()
    except NotUniqueError:
        user = User.objects(name=name).first()
    return UserResponse(id=str(user.id), name=user.name)


@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user = _get_user_or_404(user_id)
    return UserResponse(id=str(user.id), name=user.name)


# =============================================================================
# Collection Endpoints
# =============================================================================


@app.get("/users/{user_id}/collection", response_model=List[CollectionEntry])
async def get_collection(user_id: str):
    user = _get_user_or_404(user_id)
    entries = Ownership.objects(user=user).select_related()
    return [
        CollectionEntry(
            ownership_id=str(o.id),
            caught_at=o.caught_at.isoformat(),
            pokemon=_pokemon_response(o.pokemon),
        )
        for o in entries
    ]


@app.post(
    "/users/{user_id}/collection", response_model=CollectionEntry, status_code=201
)
async def catch_pokemon(user_id: str, body: CatchRequest):
    user = _get_user_or_404(user_id)
    pokemon = PokemonDoc.objects(pokemon_id=body.pokemon_id).first()
    if not pokemon:
        raise HTTPException(status_code=404, detail="Pokemon not found")
    try:
        ownership = Ownership(user=user, pokemon=pokemon).save()
    except NotUniqueError:
        raise HTTPException(status_code=409, detail="Pokemon already in collection")
    return CollectionEntry(
        ownership_id=str(ownership.id),
        caught_at=ownership.caught_at.isoformat(),
        pokemon=_pokemon_response(pokemon),
    )


@app.delete("/users/{user_id}/collection/{pokemon_id}", status_code=204)
async def release_pokemon(user_id: str, pokemon_id: int):
    user = _get_user_or_404(user_id)
    pokemon = PokemonDoc.objects(pokemon_id=pokemon_id).first()
    if not pokemon:
        raise HTTPException(status_code=404, detail="Pokemon not found")
    deleted = Ownership.objects(user=user, pokemon=pokemon).delete()
    if not deleted:
        raise HTTPException(status_code=404, detail="Pokemon not in collection")


# =============================================================================
# Battle Endpoints
# =============================================================================

BATTLE_QUEUE_KEY = "battle_queue"


def _get_owned_pokemon_or_403(user: User, pokemon_mongo_id: str) -> PokemonDoc:
    """Return the Pokemon if the user owns it, else raise 403."""
    pokemon = PokemonDoc.objects(id=pokemon_mongo_id).first()
    if not pokemon:
        raise HTTPException(
            status_code=404, detail=f"Pokemon {pokemon_mongo_id} not found"
        )
    owned = Ownership.objects(user=user, pokemon=pokemon).first()
    if not owned:
        raise HTTPException(
            status_code=403, detail=f"You do not own pokemon {pokemon_mongo_id}"
        )
    return pokemon


@app.post("/battles", response_model=BattleResponse, status_code=202)
async def initiate_battle(body: BattleRequest):
    redis = get_redis_client()
    if redis is None:
        raise HTTPException(status_code=503, detail="Battle queue unavailable")

    user = _get_user_or_404(body.user_id)
    pokemon_one = _get_owned_pokemon_or_403(user, body.pokemon_one_id)
    pokemon_two = _get_owned_pokemon_or_403(user, body.pokemon_two_id)

    if pokemon_one.id == pokemon_two.id:
        raise HTTPException(status_code=422, detail="A pokemon cannot battle itself")

    # Idempotency: return existing pending/in_progress battle for the same pair
    existing = (
        BattleHistory.objects(
            trainer=user,
            status__in=["pending", "in_progress"],
        )
        .filter(
            __raw__={
                "$or": [
                    {"pokemon_one": pokemon_one.id, "pokemon_two": pokemon_two.id},
                    {"pokemon_one": pokemon_two.id, "pokemon_two": pokemon_one.id},
                ]
            }
        )
        .first()
    )
    if existing:
        return BattleResponse(battle_id=str(existing.id))

    battle = BattleHistory(
        trainer=user,
        pokemon_one=pokemon_one,
        pokemon_two=pokemon_two,
    ).save()

    redis.rpush(BATTLE_QUEUE_KEY, str(battle.id))

    return BattleResponse(battle_id=str(battle.id))


def _battle_summary(b: BattleHistory) -> BattleSummary:
    b.pokemon_one.reload()
    b.pokemon_two.reload()
    return BattleSummary(
        battle_id=str(b.id),
        trainer_id=str(b.trainer.id),
        status=b.status,
        started_at=b.started_at.isoformat(),
        ended_at=b.ended_at.isoformat() if b.ended_at else None,
        pokemon_one=_pokemon_response(b.pokemon_one),
        pokemon_two=_pokemon_response(b.pokemon_two),
        winner_id=str(b.winner.id) if b.winner else None,
    )


def _turn_response(t: BattleTurn) -> BattleTurnResponse:
    return BattleTurnResponse(
        turn_number=t.turn_number,
        first_attacker_id=str(t.first_attacker.id),
        damage_to_pokemon_one=t.damage_to_pokemon_one,
        damage_to_pokemon_two=t.damage_to_pokemon_two,
        battle_over=t.battle_over,
    )


def _get_battle_or_404(battle_id: str) -> BattleHistory:
    battle = BattleHistory.objects(id=battle_id).first()
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    return battle


@app.get("/battles", response_model=List[BattleSummary])
async def list_battles(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    battles = (
        BattleHistory.objects()
        .order_by("-started_at")
        .skip(offset)
        .limit(limit)
        .select_related()
    )
    return [_battle_summary(b) for b in battles]


@app.get("/battles/{battle_id}", response_model=BattleDetail)
async def get_battle(battle_id: str):
    battle = _get_battle_or_404(battle_id)
    turns = [
        _turn_response(t)
        for t in BattleTurn.objects(battle=battle).order_by("turn_number")
    ]
    return BattleDetail(**_battle_summary(battle).model_dump(), turns=turns)


# =============================================================================
# Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
