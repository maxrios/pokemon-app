import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional
from pydantic import BaseModel

from database import initialize_database, close_database_connection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# =============================================================================
# Pydantic Models (Request/Response schemas)
# =============================================================================

class Pokemon(BaseModel):
    """Pokemon data model."""
    id: int
    name: str
    types: List[str]
    stats: dict  # hp, attack, defense, speed, etc.


class CollectionItem(BaseModel):
    """A Pokemon in a user's collection."""
    pokemon_id: int
    pokemon_name: str
    added_at: Optional[str] = None


class BattleRequest(BaseModel):
    """Request to start a battle."""
    pokemon1_id: int
    pokemon2_id: int


class BattleResult(BaseModel):
    """Result of a battle."""
    battle_id: str
    winner_id: int
    winner_name: str
    turns: int


# =============================================================================
# Application Setup
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    initialize_database()
    logger.info("Application startup complete")
    yield
    # Shutdown
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
# Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
