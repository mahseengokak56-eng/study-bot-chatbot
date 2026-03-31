from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from pymongo import MongoClient
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime
import os
import json
import asyncio

# ─── Load environment variables ───────────────────────────────────────────────
load_dotenv()

# ─── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="Study Bot API", version="1.0.0")

# ─── CORS — allow React frontend to talk to this API ──────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Groq LLM setup ───────────────────────────────────────────────────────────
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.1-8b-instant"
)

# ─── MongoDB connection ────────────────────────────────────────────────────────
try:
    client = MongoClient(os.getenv("MONGODB_URI"), serverSelectionTimeoutMS=5000)
    client.server_info()  # Test connection
    db = client["studybot_db"]
    collection = db["chat_history"]
    print("✅ MongoDB connected successfully")
except Exception as e:
    print(f"⚠️  MongoDB connection failed: {e}")
    collection = None

# ─── System prompt ────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are Study Bot 📚, an AI assistant designed to help students with academic questions.

Guidelines:
- Explain concepts clearly using simple, beginner-friendly language
- Use bullet points and numbered lists when helpful
- Provide code examples with proper formatting when relevant
- Break down complex topics into digestible steps
- Always encourage the student and be supportive
- If the question is not study-related, gently redirect to academic topics

You excel in: Mathematics, Physics, Chemistry, Biology, Computer Science, History, Literature, and more."""

# ─── Request / Response models ────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

class ChatResponse(BaseModel):
    response: str
    session_id: str

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {"status": "running", "message": "📚 Study Bot API is running!"}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Build conversation history for context
    messages = [SystemMessage(content=SYSTEM_PROMPT)]

    # Retrieve last 5 messages from this session for context
    if collection is not None:
        history = list(
            collection.find({"session_id": req.session_id})
                      .sort("timestamp", -1)
                      .limit(5)
        )
        for chat_entry in reversed(history):
            messages.append(HumanMessage(content=chat_entry["user"]))
            messages.append(AIMessage(content=chat_entry["bot"]))

    # Append the current user message
    messages.append(HumanMessage(content=req.message))

    try:
        # Call Groq LLM
        response = llm.invoke(messages)
        bot_reply = response.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    # Store conversation in MongoDB
    if collection is not None:
        try:
            collection.insert_one({
                "session_id": req.session_id,
                "user": req.message,
                "bot": bot_reply,
                "timestamp": datetime.utcnow()
            })
        except Exception as e:
            print(f"⚠️  Failed to save to MongoDB: {e}")
            # Don't crash — still return the response

    return ChatResponse(response=bot_reply, session_id=req.session_id)


@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """Stream tokens using Server-Sent Events (SSE) for typewriter effect."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Build messages list with context
    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    if collection is not None:
        history = list(
            collection.find({"session_id": req.session_id})
                      .sort("timestamp", -1)
                      .limit(5)
        )
        for entry in reversed(history):
            messages.append(HumanMessage(content=entry["user"]))
            messages.append(AIMessage(content=entry["bot"]))
    messages.append(HumanMessage(content=req.message))

    async def token_generator():
        full_response = ""
        try:
            # Stream tokens from Groq
            for chunk in llm.stream(messages):
                token = chunk.content
                if token:
                    full_response += token
                    # SSE format: data: <json>\n\n
                    yield f"data: {json.dumps({'token': token})}\n\n"
                    await asyncio.sleep(0)  # yield control back to event loop

            # Signal completion
            yield f"data: {json.dumps({'done': True})}\n\n"

            # Save to MongoDB after streaming completes
            if collection is not None:
                try:
                    collection.insert_one({
                        "session_id": req.session_id,
                        "user": req.message,
                        "bot": full_response,
                        "timestamp": datetime.utcnow()
                    })
                except Exception as e:
                    print(f"⚠️  MongoDB save failed: {e}")

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        token_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@app.get("/history/{session_id}")
async def get_history(session_id: str, limit: int = 20):
    """Fetch chat history for a given session from MongoDB."""
    if collection is None:
        raise HTTPException(status_code=503, detail="Database not available")

    history = list(
        collection.find({"session_id": session_id}, {"_id": 0})
                  .sort("timestamp", 1)
                  .limit(limit)
    )
    return {"session_id": session_id, "messages": history}


@app.get("/sessions")
async def get_sessions():
    """Fetch all unique session IDs with their first message as a title."""
    if collection is None:
        raise HTTPException(status_code=503, detail="Database not available")

    pipeline = [
        {"$sort": {"timestamp": 1}},
        {"$group": {
            "_id": "$session_id",
            "title": {"$first": "$user"},
            "last_active": {"$last": "$timestamp"},
            "message_count": {"$sum": 1}
        }},
        {"$sort": {"last_active": -1}},
        {"$limit": 20}
    ]
    sessions = list(collection.aggregate(pipeline))

    return {"sessions": [
        {
            "session_id": s["_id"],
            "title": (s["title"][:40] + "...") if len(s["title"]) > 40 else s["title"],
            "last_active": s["last_active"].isoformat() if s["last_active"] else None,
            "message_count": s["message_count"]
        }
        for s in sessions
    ]}


@app.delete("/history/{session_id}")
async def delete_session(session_id: str):
    """Delete all messages in a session."""
    if collection is None:
        raise HTTPException(status_code=503, detail="Database not available")

    result = collection.delete_many({"session_id": session_id})
    return {"deleted": result.deleted_count, "session_id": session_id}