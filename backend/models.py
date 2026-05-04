from mongoengine import (
    BooleanField,
    DateTimeField,
    Document,
    FloatField,
    IntField,
    ListField,
    ReferenceField,
    StringField,
)
from datetime import datetime, timezone


class Pokemon(Document):
    pokemon_id = IntField(required=True, unique=True)
    name = StringField(required=True)
    types = ListField(StringField(), required=True)
    hp = IntField(required=True)
    attack = IntField(required=True)
    defense = IntField(required=True)
    special_attack = IntField(required=True)
    special_defense = IntField(required=True)
    speed = IntField(required=True)
    description = StringField(default="")
    generation = IntField(default=1)
    height = FloatField(default=0.0)
    weight = FloatField(default=0.0)
    image_url = StringField(default="")

    meta = {
        "collection": "pokemon",
        "indexes": ["pokemon_id", "name"],
    }


class User(Document):
    name = StringField(required=True, unique=True)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        "collection": "users",
        "indexes": ["name"],
    }


class Ownership(Document):
    user = ReferenceField(User, required=True)
    pokemon = ReferenceField(Pokemon, required=True)
    caught_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    meta = {
        "collection": "ownership",
        "indexes": [
            {"fields": ["user", "pokemon"], "unique": True},
        ],
    }


class BattleHistory(Document):
    pokemon_one = ReferenceField(Pokemon, required=True)
    pokemon_two = ReferenceField(Pokemon, required=True)
    winner = ReferenceField(Pokemon, default=None)
    status = StringField(
        required=True,
        choices=["pending", "in_progress", "completed", "failed"],
        default="pending",
    )
    started_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    ended_at = DateTimeField(default=None)

    meta = {
        "collection": "battle_history",
        "indexes": ["-started_at"],
    }


class BattleTurn(Document):
    battle = ReferenceField(BattleHistory, required=True)
    turn_number = IntField(required=True)
    first_attacker = ReferenceField(Pokemon, required=True)
    damage_to_pokemon_one = IntField(required=True)
    damage_to_pokemon_two = IntField(required=True)
    battle_over = BooleanField(default=False)

    meta = {
        "collection": "battle_turns",
        "indexes": [
            {"fields": ["battle", "turn_number"], "unique": True},
        ],
    }
