from mongoengine import (
    Document,
    StringField,
    IntField,
    FloatField,
    ListField,
    ReferenceField,
    DateTimeField,
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
