import json
import os
from mongoengine import connect, disconnect
from settings import Settings
import logging
from typing import Optional
import redis

logger = logging.getLogger(__name__)

# Global Redis client
_redis_client: Optional[redis.Redis] = None


def initialize_database(mongo_bool: bool = True, redis_bool: bool = True):
    """Initialize and configure database connections."""
    settings = Settings.instance()

    if mongo_bool:
        try:
            # Connect to MongoDB using MongoEngine
            connect(**settings.MONGO.MONGODB_SETTINGS)
            logger.info("Connected to MongoDB using MongoEngine")

            # Note: MongoEngine handles indexes automatically based on model definitions

        except Exception as e:
            logger.error(f"Could not connect to MongoDB: {e}")
            raise

        seed_pokemon()

    if redis_bool:
        initialize_redis()


def seed_pokemon():
    """Seed the pokemon collection from pokemon.json if it is empty."""
    from models import Pokemon

    if Pokemon.objects.count() > 0:
        return

    seed_path = os.path.join(os.path.dirname(__file__), "data", "pokemon.json")
    if not os.path.exists(seed_path):
        logger.warning("pokemon.json not found at %s, skipping seed", seed_path)
        return

    with open(seed_path) as f:
        records = json.load(f)

    docs = [
        Pokemon(
            pokemon_id=r["id"],
            name=r["name"],
            types=r["types"],
            hp=r["hp"],
            attack=r["attack"],
            defense=r["defense"],
            special_attack=r["specialAttack"],
            special_defense=r["specialDefense"],
            speed=r["speed"],
            description=r.get("description", ""),
            generation=r.get("generation", 1),
            height=r.get("height", 0.0),
            weight=r.get("weight", 0.0),
            image_url=r.get("imageUrl", ""),
        )
        for r in records
    ]
    Pokemon.objects.insert(docs)
    logger.info("Seeded %d pokemon from pokemon.json", len(docs))


def initialize_redis() -> Optional[redis.Redis]:
    """Initialize Redis connection with graceful error handling."""
    global _redis_client
    settings = Settings.instance()

    try:
        _redis_client = redis.Redis.from_url(
            settings.REDIS.REDIS_URL, **settings.REDIS.connection_kwargs
        )
        # Test connection
        _redis_client.ping()
        logger.info(f"Connected to Redis at {settings.REDIS.REDIS_URL}")
        return _redis_client
    except redis.ConnectionError as e:
        logger.warning(
            f"Could not connect to Redis: {e}. Rate limiting will use in-memory fallback."
        )
        _redis_client = None
        return None
    except Exception as e:
        logger.error(f"Unexpected error connecting to Redis: {e}")
        _redis_client = None
        return None


def get_redis_client() -> Optional[redis.Redis]:
    """Get the Redis client instance. Returns None if Redis is unavailable."""
    global _redis_client

    if _redis_client is None:
        return None

    # Check if connection is still alive
    try:
        _redis_client.ping()
        return _redis_client
    except redis.ConnectionError:
        logger.warning(
            "Redis connection lost. Rate limiting will use in-memory fallback."
        )
        _redis_client = None
        return None


def close_database_connection():
    """Close database connections."""
    global _redis_client

    try:
        disconnect()
        logger.info("Disconnected from MongoDB")
    except Exception as e:
        logger.error(f"Error disconnecting from MongoDB: {e}")
    if _redis_client:
        try:
            _redis_client.close()
            logger.info("Disconnected from Redis")
        except Exception as e:
            logger.error(f"Error disconnecting from Redis: {e}")
        _redis_client = None
