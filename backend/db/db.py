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


# ── Prediction Tracking Operations ────────────────────────────────────────────
def get_collections_extended():
    """Get all collections including predictions."""
    db = get_db()
    return db["users"], db["chats"], db["stress_predictions"], db["performance_predictions"]

def save_stress_prediction(user_id: str, inputs: dict, result: dict) -> str:
    """Save a stress prediction to database."""
    _, _, stress_collection, _ = get_collections_extended()
    
    prediction_doc = {
        "user_id": user_id,
        "inputs": inputs,
        "result": result,
        "timestamp": datetime.now(timezone.utc)
    }
    
    result_obj = stress_collection.insert_one(prediction_doc)
    return str(result_obj.inserted_id)

def save_performance_prediction(user_id: str, inputs: dict, result: dict) -> str:
    """Save a performance prediction to database."""
    _, _, _, perf_collection = get_collections_extended()
    
    prediction_doc = {
        "user_id": user_id,
        "inputs": inputs,
        "result": result,
        "timestamp": datetime.now(timezone.utc)
    }
    
    result_obj = perf_collection.insert_one(prediction_doc)
    return str(result_obj.inserted_id)

def get_stress_prediction_count(user_id: str) -> int:
    """Get count of stress predictions for a user."""
    _, _, stress_collection, _ = get_collections_extended()
    return stress_collection.count_documents({"user_id": user_id})

def get_performance_prediction_count(user_id: str) -> int:
    """Get count of performance predictions for a user."""
    _, _, _, perf_collection = get_collections_extended()
    return perf_collection.count_documents({"user_id": user_id})


# ── Quiz Results Tracking ───────────────────────────────────────────────────
def save_quiz_result(user_id: str, quiz_data: dict, score: int, total_questions: int) -> str:
    """Save a quiz result to database."""
    db = get_db()
    quiz_results_collection = db["quiz_results"]
    
    result_doc = {
        "user_id": user_id,
        "topic": quiz_data.get("topic", ""),
        "difficulty": quiz_data.get("difficulty", "medium"),
        "score": score,
        "total_questions": total_questions,
        "percentage": (score / total_questions * 100) if total_questions > 0 else 0,
        "timestamp": datetime.now(timezone.utc)
    }
    
    result_obj = quiz_results_collection.insert_one(result_doc)
    return str(result_obj.inserted_id)

def get_quiz_results(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Get quiz results for a user."""
    db = get_db()
    quiz_results_collection = db["quiz_results"]
    
    results = list(
        quiz_results_collection
        .find({"user_id": user_id}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(limit)
    )
    
    # Convert datetime to ISO format for JSON serialization
    for result in results:
        if "timestamp" in result:
            result["timestamp"] = result["timestamp"].isoformat()
    
    return list(reversed(results))

def get_quiz_stats(user_id: str) -> Dict[str, Any]:
    """Get quiz statistics for a user."""
    db = get_db()
    quiz_results_collection = db["quiz_results"]
    
    total_quizzes = quiz_results_collection.count_documents({"user_id": user_id})
    
    # Get all results for average calculation
    results = list(quiz_results_collection.find({"user_id": user_id}, {"_id": 0}))
    
    if results:
        avg_percentage = sum(r.get("percentage", 0) for r in results) / len(results)
        best_score = max(r.get("percentage", 0) for r in results)
        recent_results = sorted(results, key=lambda x: x.get("timestamp", datetime.min), reverse=True)[:5]
    else:
        avg_percentage = 0
        best_score = 0
        recent_results = []
    
    return {
        "total_quizzes": total_quizzes,
        "average_percentage": round(avg_percentage, 2),
        "best_score": round(best_score, 2),
        "recent_results": recent_results
    }


# ── Notes History Tracking ─────────────────────────────────────────────────
def save_notes_history(user_id: str, topic: str, detail_level: str, notes_content: dict, uploaded_files: List[str] = None) -> str:
    """Save notes generation history to database."""
    db = get_db()
    notes_history_collection = db["notes_history"]
    
    notes_doc = {
        "user_id": user_id,
        "topic": topic,
        "detail_level": detail_level,
        "notes_content": notes_content,
        "uploaded_files": uploaded_files or [],
        "timestamp": datetime.now(timezone.utc)
    }
    
    result_obj = notes_history_collection.insert_one(notes_doc)
    return str(result_obj.inserted_id)

def get_notes_history(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Get notes generation history for a user."""
    db = get_db()
    notes_history_collection = db["notes_history"]
    
    history = list(
        notes_history_collection
        .find({"user_id": user_id}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(limit)
    )
    
    # Convert datetime to ISO format for JSON serialization
    for note in history:
        if "timestamp" in note:
            note["timestamp"] = note["timestamp"].isoformat()
    
    return history


# ── Uploaded Files Tracking ──────────────────────────────────────────────────
def save_uploaded_files(user_id: str, files: List[dict]) -> List[str]:
    """Save uploaded file metadata to database."""
    db = get_db()
    files_collection = db["uploaded_files"]
    
    file_ids = []
    for file in files:
        file_doc = {
            "user_id": user_id,
            "filename": file.get("filename", ""),
            "content_type": file.get("content_type", ""),
            "size": file.get("size", 0),
            "content_preview": file.get("content_preview", "")[:1000],  # Store first 1000 chars
            "timestamp": datetime.now(timezone.utc)
        }
        result = files_collection.insert_one(file_doc)
        file_ids.append(str(result.inserted_id))
    
    return file_ids

def get_user_files(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Get uploaded files for a user."""
    db = get_db()
    files_collection = db["uploaded_files"]
    
    files = list(
        files_collection
        .find({"user_id": user_id})
        .sort("timestamp", -1)
        .limit(limit)
    )
    
    # Convert ObjectId to string and datetime to ISO format
    for file in files:
        if "_id" in file:
            file["_id"] = str(file["_id"])
        if "timestamp" in file:
            file["timestamp"] = file["timestamp"].isoformat()
    
    return files
