"""
MongoDB Document Models

Define your MongoDB document models here using MongoEngine.
These models represent collections in your MongoDB database.
"""

from mongoengine import Document, StringField, IntField, ListField, DateTimeField, DictField
from datetime import datetime


# =============================================================================
# Example Models (feel free to modify or replace)
# =============================================================================

class CollectionItem(Document):
    """
    A Pokemon in a user's collection.
    """
    pokemon_id = IntField(required=True, unique=True)

    meta = {
        "collection": "collection",
        "indexes": ["pokemon_id"],
    }


