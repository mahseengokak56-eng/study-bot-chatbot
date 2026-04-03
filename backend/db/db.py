"""
db.py — Database Layer
======================
MongoDB connection and database operations for users and chats.
"""

import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ── MongoDB Connection ───────────────────────────────────────────────────────
def get_db():
    """Get database connection."""
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    return client["studybot_db"]


def get_collections():
    """Get users and chats collections."""
    db = get_db()
    return db["users"], db["chats"]


# ── User Operations ──────────────────────────────────────────────────────────
def create_user(name: str, email: str, hashed_password: str) -> Optional[str]:
    """Create a new user. Returns user_id or None if email exists."""
    users_collection, _ = get_collections()

    # Check if email already exists
    if users_collection.find_one({"email": email}):
        return None

    user_doc = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    result = users_collection.insert_one(user_doc)
    return str(result.inserted_id)


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email."""
    users_collection, _ = get_collections()
    return users_collection.find_one({"email": email})


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID."""
    users_collection, _ = get_collections()
    try:
        return users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        return None


# ── Chat Operations ──────────────────────────────────────────────────────────
def save_chat(user_id: str, message: str, response: str, category: str) -> str:
    """Save a chat message to database."""
    _, chats_collection = get_collections()

    chat_doc = {
        "user_id": user_id,
        "message": message,
        "response": response,
        "category": category,
        "timestamp": datetime.now(timezone.utc)
    }

    result = chats_collection.insert_one(chat_doc)
    return str(result.inserted_id)


def get_chat_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Get chat history for a user."""
    _, chats_collection = get_collections()

    chats = list(
        chats_collection
        .find({"user_id": user_id}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(limit)
    )

    # Convert datetime to ISO format for JSON serialization
    for chat in chats:
        if "timestamp" in chat:
            chat["timestamp"] = chat["timestamp"].isoformat()

    return list(reversed(chats))  # Return oldest first


def get_user_stats(user_id: str) -> Dict[str, Any]:
    """Get chat statistics for a user."""
    _, chats_collection = get_collections()

    total_chats = chats_collection.count_documents({"user_id": user_id})

    # Get category distribution
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]

    categories = list(chats_collection.aggregate(pipeline))
    category_counts = {cat["_id"]: cat["count"] for cat in categories}

    return {
        "total_chats": total_chats,
        "categories": category_counts
    }
