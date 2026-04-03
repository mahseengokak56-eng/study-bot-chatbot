"""
main.py — Hybrid ML + Chatbot API
==================================
FastAPI application with:
- Authentication (JWT + bcrypt)
- ML-based category prediction
- Chatbot responses (rule-based + optional LLM)
- MongoDB storage
"""

import os
import sys
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from dotenv import load_dotenv

# Add backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

# ── Load environment variables ──────────────────────────────────────────────
load_dotenv()

# ── Import our modules ───────────────────────────────────────────────────────
from backend.ml.predict import predict_category, get_predictor
from backend.auth.auth import (
    UserRegister, UserLogin, Token,
    hash_password, verify_password, create_access_token,
    decode_token, get_token_from_header, TokenData
)
from backend.db.db import (
    create_user, get_user_by_email, get_user_by_id,
    save_chat, get_chat_history, get_user_stats
)

# ── Optional LLM support ────────────────────────────────────────────────────
try:
    from langchain_groq import ChatGroq
    from langchain_core.messages import HumanMessage, SystemMessage
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False

# ── Initialize FastAPI ──────────────────────────────────────────────────────
app = FastAPI(
    title="Study Bot API",
    description="Hybrid ML + NLP Chatbot with Authentication",
    version="2.0.0"
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Optional LLM setup ───────────────────────────────────────────────────────
llm = None
if LLM_AVAILABLE and os.getenv("GROQ_API_KEY"):
    try:
        llm = ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model="llama-3.1-8b-instant"
        )
    except Exception as e:
        print(f"⚠️ LLM initialization failed: {e}")

# ── Response templates by category ───────────────────────────────────────────
CATEGORY_RESPONSES = {
    "academic": """I'd be happy to help with your academic question! 

Here are some tips:
• Break down the problem into smaller steps
• Review your class notes or textbook
• Practice with similar examples
• Don't hesitate to ask your teacher for clarification

Would you like me to explain this topic in more detail?""",

    "stress": """I understand you're feeling stressed. That's completely normal, especially during exams.

Here are some quick ways to manage stress:
• Take 5 deep breaths
• Take a short walk or stretch
• Listen to calming music
• Talk to a friend or family member
• Remember: you've got this!

Take care of yourself first, then tackle your studies.""",

    "motivation": """I hear you, and I want you to know that it's okay to feel this way sometimes.

Here's some encouragement:
• Progress is progress, no matter how small
• Every expert was once a beginner
• You're capable of more than you think
• One step at a time is still moving forward

You've overcome challenges before, and you can do it again. I believe in you!""",

    "tips": """Great question! Here are some effective study tips:

• Use the Pomodoro Technique (25 min study, 5 min break)
• Create a study schedule and stick to it
• Use active recall and spaced repetition
• Summarize concepts in your own words
• Teach what you've learned to someone else
• Get plenty of sleep and stay hydrated

Which tip would you like to try first?""",

    "general": """Hello! I'm Study Bot, your academic companion.

I can help you with:
📚 Academic questions and explanations
🧘 Managing study stress
💪 Staying motivated
📖 Study tips and techniques

What would you like help with today?"""
}

# ── Pydantic Models ───────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    use_llm: bool = Field(default=False, description="Enhance response with LLM if available")


class ChatResponse(BaseModel):
    response: str
    predicted_category: str
    timestamp: str


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    created_at: str


class HistoryResponse(BaseModel):
    messages: List[dict]
    total: int


# ── Dependency: Get current user from token ───────────────────────────────────
async def get_current_user(authorization: str = Header(None)) -> TokenData:
    """Verify JWT token and return user data."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token = get_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token_data = decode_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return token_data


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    """Health check endpoint."""
    return {
        "status": "running",
        "message": "📚 Study Bot API v2.0 is running!",
        "features": ["authentication", "ml_prediction", "chatbot"],
        "llm_available": LLM_AVAILABLE and llm is not None
    }


# ── Authentication Routes ─────────────────────────────────────────────────────

@app.post("/api/register", response_model=dict)
async def register(user: UserRegister):
    """Register a new user."""
    # Simple validation
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    if len(user.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")

    # Hash password
    hashed = hash_password(user.password)

    # Create user
    user_id = create_user(user.name.strip(), user.email.lower(), hashed)

    if not user_id:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create token
    token = create_access_token(user_id, user.email)

    return {
        "message": "User registered successfully",
        "user_id": user_id,
        "access_token": token,
        "token_type": "bearer"
    }


@app.post("/api/login", response_model=dict)
async def login(credentials: UserLogin):
    """Login and get access token."""
    # Find user
    user = get_user_by_email(credentials.email.lower())
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verify password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create token
    user_id = str(user["_id"])
    token = create_access_token(user_id, user["email"])

    return {
        "message": "Login successful",
        "user_id": user_id,
        "name": user["name"],
        "access_token": token,
        "token_type": "bearer"
    }


@app.get("/api/me", response_model=UserProfile)
async def get_profile(current_user: TokenData = Depends(get_current_user)):
    """Get current user's profile."""
    user = get_user_by_id(current_user.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserProfile(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        created_at=user["created_at"].isoformat() if user.get("created_at") else ""
    )


# ── Chat Routes ──────────────────────────────────────────────────────────────

@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Process a chat message:
    1. Predict category using ML
    2. Generate response based on category
    3. Optionally enhance with LLM
    4. Save to database
    """
    user_message = request.message.strip()

    # Step 1: ML Prediction
    try:
        predicted_category = predict_category(user_message)
    except Exception as e:
        print(f"ML prediction error: {e}")
        predicted_category = "general"

    # Step 2: Generate base response
    base_response = CATEGORY_RESPONSES.get(
        predicted_category,
        CATEGORY_RESPONSES["general"]
    )

    # Step 3: Optionally enhance with LLM
    response = base_response
    if request.use_llm and llm is not None:
        try:
            system_msg = f"""You are Study Bot, a helpful academic assistant.
The user's message was categorized as: {predicted_category}
Provide a helpful, encouraging response. Keep it concise (2-3 short paragraphs)."""

            messages = [
                SystemMessage(content=system_msg),
                HumanMessage(content=user_message)
            ]
            llm_response = llm.invoke(messages)
            if llm_response and llm_response.content:
                response = llm_response.content
        except Exception as e:
            print(f"LLM enhancement failed: {e}")
            # Fall back to base response

    # Step 4: Save to database
    try:
        save_chat(
            user_id=current_user.user_id,
            message=user_message,
            response=response,
            category=predicted_category
        )
    except Exception as e:
        print(f"Failed to save chat: {e}")
        # Don't fail the request if saving fails

    return ChatResponse(
        response=response,
        predicted_category=predicted_category,
        timestamp=datetime.utcnow().isoformat()
    )


@app.get("/api/history", response_model=HistoryResponse)
async def get_history(
    limit: int = 50,
    current_user: TokenData = Depends(get_current_user)
):
    """Get chat history for the current user."""
    try:
        messages = get_chat_history(current_user.user_id, limit)
        return HistoryResponse(messages=messages, total=len(messages))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")


@app.get("/api/stats")
async def get_stats(current_user: TokenData = Depends(get_current_user)):
    """Get chat statistics for the current user."""
    try:
        stats = get_user_stats(current_user.user_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")


# ── Legacy routes (for backward compatibility) ─────────────────────────────
@app.get("/health")
def health_check():
    """Simple health check."""
    return {"status": "ok"}


# ── Startup: Verify ML model is loaded ─────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Initialize ML predictor on startup."""
    try:
        get_predictor()
        print("✅ ML model loaded successfully")
    except FileNotFoundError as e:
        print(f"⚠️ {e}")
        print("💡 Run: python backend/ml/train.py")
    except Exception as e:
        print(f"⚠️ ML model error: {e}")