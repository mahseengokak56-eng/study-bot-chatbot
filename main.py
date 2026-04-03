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

# ── Import ML predictors ────────────────────────────────────────────────────
from backend.ml.predict import predict_category, get_predictor
from backend.ml.stress_predictor import predict_stress, train_stress_model
from backend.ml.performance_predictor import predict_performance, train_performance_model
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
    allow_origins=["*"],
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

    # Step 3: Generate intelligent response with LLM
    response = ""
    if llm is not None:
        try:
            system_msg = f"""You are EduNova AI, an intelligent and friendly educational assistant. 
The user's query was categorized by our ML system as: {predicted_category.upper()}.

Provide a helpful, comprehensive, and accurate response to the user's question. 
Be conversational, encouraging, and educational. Answer the question directly 
with specific information, not generic advice.

If the question is academic, explain concepts clearly with examples.
If it's about stress, provide empathy and practical coping strategies.
If it's about motivation, be encouraging and inspiring.
If it's about study tips, give specific actionable techniques.

Keep responses informative but concise (3-5 paragraphs)."""

            messages = [
                SystemMessage(content=system_msg),
                HumanMessage(content=user_message)
            ]
            llm_response = llm.invoke(messages)
            if llm_response and llm_response.content:
                response = llm_response.content
        except Exception as e:
            print(f"LLM enhancement failed: {e}")
    
    # Fall back to category template if LLM not available or failed
    if not response:
        response = CATEGORY_RESPONSES.get(
            predicted_category,
            CATEGORY_RESPONSES["general"]
        )

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


# ── NEW: Stress Prediction API ─────────────────────────────────────────────────
class StressPredictRequest(BaseModel):
    study_hours: float = Field(..., ge=0, le=12, description="Hours spent studying per day")
    sleep_hours: float = Field(..., ge=0, le=12, description="Hours of sleep per day")
    screen_time: float = Field(..., ge=0, le=12, description="Hours of screen time per day")

class StressPredictResponse(BaseModel):
    level: str
    confidence: float
    recommendation: str
    tips: List[str]
    inputs: dict

@app.post("/api/stress-predict", response_model=StressPredictResponse)
async def stress_predict(
    request: StressPredictRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Predict stress level based on lifestyle factors."""
    try:
        result = predict_stress(
            study_hours=request.study_hours,
            sleep_hours=request.sleep_hours,
            screen_time=request.screen_time
        )
        return StressPredictResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ── NEW: Performance Prediction API ──────────────────────────────────────────
class PerformancePredictRequest(BaseModel):
    attendance: float = Field(..., ge=0, le=100, description="Attendance percentage")
    study_hours: float = Field(..., ge=0, le=12, description="Daily study hours")
    assignments_completed: float = Field(..., ge=0, le=100, description="Assignment completion percentage")

class PerformancePredictResponse(BaseModel):
    level: str
    confidence: float
    recommendation: str
    improvement_tips: List[str]
    scores: dict
    inputs: dict

@app.post("/api/performance-predict", response_model=PerformancePredictResponse)
async def performance_predict(
    request: PerformancePredictRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Predict academic performance based on study habits."""
    try:
        result = predict_performance(
            attendance=request.attendance,
            study_hours=request.study_hours,
            assignments_completed=request.assignments_completed
        )
        return PerformancePredictResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ── NEW: Quiz Generator API ───────────────────────────────────────────────────
class QuizRequest(BaseModel):
    topic: str = Field(..., min_length=3, description="Topic for the quiz")
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")
    num_questions: int = Field(default=5, ge=3, le=10)

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class QuizResponse(BaseModel):
    topic: str
    questions: List[QuizQuestion]
    total_questions: int

@app.post("/api/quiz", response_model=QuizResponse)
async def generate_quiz(
    request: QuizRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Generate a quiz on a specific topic using LLM."""
    if not llm:
        # Fallback: generate sample quiz
        sample_questions = [
            QuizQuestion(
                question=f"What is the main concept of {request.topic}?",
                options=["Option A", "Option B", "Option C", "Option D"],
                correct_answer="Option A",
                explanation="This is a sample explanation."
            ),
            QuizQuestion(
                question=f"How does {request.topic} work in practice?",
                options=["Method 1", "Method 2", "Method 3", "Method 4"],
                correct_answer="Method 2",
                explanation="This is another sample explanation."
            ),
            QuizQuestion(
                question=f"Which of the following best describes {request.topic}?",
                options=["Description 1", "Description 2", "Description 3", "Description 4"],
                correct_answer="Description 3",
                explanation="Final sample explanation."
            ),
        ]
        return QuizResponse(
            topic=request.topic,
            questions=sample_questions[:request.num_questions],
            total_questions=min(request.num_questions, len(sample_questions))
        )
    
    try:
        system_msg = f"""You are a quiz generator. Create {request.num_questions} multiple choice questions about "{request.topic}" at {request.difficulty} difficulty.

Format each question as:
Q: [Question text]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
Correct: [A/B/C/D]
Explanation: [Brief explanation]

Make questions educational and clear."""

        messages = [
            SystemMessage(content=system_msg),
            HumanMessage(content=f"Generate a quiz about {request.topic}")
        ]
        
        response = llm.invoke(messages)
        
        # Parse the response (simplified parsing)
        questions = []
        lines = response.content.split('\n')
        current_q = {}
        
        for line in lines:
            line = line.strip()
            if line.startswith('Q:'):
                if current_q.get('question'):
                    questions.append(current_q)
                current_q = {'question': line[2:].strip(), 'options': []}
            elif line.startswith(('A)', 'B)', 'C)', 'D)')):
                current_q['options'].append(line[2:].strip())
            elif line.startswith('Correct:'):
                current_q['correct_answer'] = line[8:].strip()
            elif line.startswith('Explanation:'):
                current_q['explanation'] = line[12:].strip()
        
        if current_q.get('question'):
            questions.append(current_q)
        
        # Format questions properly
        formatted_questions = []
        for q in questions[:request.num_questions]:
            formatted_questions.append(QuizQuestion(
                question=q.get('question', 'Sample question'),
                options=q.get('options', ['A', 'B', 'C', 'D']),
                correct_answer=q.get('correct_answer', 'A'),
                explanation=q.get('explanation', 'No explanation available.')
            ))
        
        return QuizResponse(
            topic=request.topic,
            questions=formatted_questions,
            total_questions=len(formatted_questions)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")


# ── NEW: Notes Generator API ──────────────────────────────────────────────────
class NotesRequest(BaseModel):
    topic: str = Field(..., min_length=3, description="Topic for notes")
    detail_level: str = Field(default="medium", pattern="^(brief|medium|detailed)$")

class NotesResponse(BaseModel):
    topic: str
    heading: str
    key_points: List[str]
    summary: str
    full_content: str

@app.post("/api/notes", response_model=NotesResponse)
async def generate_notes(
    request: NotesRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Generate structured notes on a specific topic using LLM."""
    if not llm:
        # Fallback: generate sample notes
        return NotesResponse(
            topic=request.topic,
            heading=f"Notes: {request.topic}",
            key_points=[
                f"Key concept 1 about {request.topic}",
                f"Key concept 2 about {request.topic}",
                f"Key concept 3 about {request.topic}",
            ],
            summary=f"This is a brief summary of {request.topic}. It covers the fundamental concepts and important aspects.",
            full_content=f"# {request.topic}\n\n## Overview\n{request.topic} is an important subject...\n\n## Key Concepts\n- Concept 1\n- Concept 2\n- Concept 3\n\n## Summary\nIn summary, {request.topic} is essential to understand."
        )
    
    try:
        detail_instruction = {
            "brief": "Provide a brief overview with 3-4 key points",
            "medium": "Provide a comprehensive overview with 5-7 key points",
            "detailed": "Provide detailed notes with 8-10 key points and examples"
        }
        
        system_msg = f"""You are an educational notes generator. Create structured notes about "{request.topic}".

{detail_instruction[request.detail_level]}

Format your response as:
HEADING: [Descriptive heading]

KEY POINTS:
• [Point 1]
• [Point 2]
• [Point 3]
...

SUMMARY:
[2-3 sentence summary]

FULL NOTES:
[Detailed content in markdown format]

Make it educational and well-structured."""

        messages = [
            SystemMessage(content=system_msg),
            HumanMessage(content=f"Generate notes about {request.topic}")
        ]
        
        response = llm.invoke(messages)
        content = response.content
        
        # Parse the response
        heading = request.topic
        key_points = []
        summary = ""
        full_content = content
        
        lines = content.split('\n')
        section = None
        
        for line in lines:
            line = line.strip()
            if line.startswith('HEADING:'):
                heading = line[8:].strip()
            elif line.startswith('KEY POINTS:'):
                section = 'key_points'
            elif line.startswith('SUMMARY:'):
                section = 'summary'
            elif line.startswith('FULL NOTES:'):
                section = 'full'
            elif line.startswith('•') and section == 'key_points':
                key_points.append(line[1:].strip())
            elif section == 'summary' and line and not line.startswith('FULL'):
                summary += line + ' '
        
        if not key_points:
            key_points = [f"Important aspect of {request.topic}", f"Key concept in {request.topic}"]
        if not summary:
            summary = f"This covers the essential information about {request.topic}."
            
        return NotesResponse(
            topic=request.topic,
            heading=heading,
            key_points=key_points[:10],
            summary=summary.strip(),
            full_content=full_content
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notes generation failed: {str(e)}")


# ── NEW: Dashboard Stats API ─────────────────────────────────────────────────
class DashboardStatsResponse(BaseModel):
    total_queries: int
    category_distribution: dict
    recent_chats: List[dict]
    top_topics: List[str]
    stress_predictions: int
    performance_predictions: int

@app.get("/api/dashboard", response_model=DashboardStatsResponse)
async def get_dashboard_stats(current_user: TokenData = Depends(get_current_user)):
    """Get comprehensive dashboard statistics for the user."""
    try:
        # Get basic stats
        stats = get_user_stats(current_user.user_id)
        
        # Get recent chat history for analysis
        history = get_chat_history(current_user.user_id, limit=100)
        
        # Calculate category distribution
        category_counts = {}
        for msg in history:
            cat = msg.get('category', 'general')
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        # Extract top topics (simplified - from message content)
        topics = []
        for msg in history[:20]:
            content = msg.get('message', '')
            # Simple keyword extraction
            words = content.lower().split()[:3]
            if words:
                topics.append(' '.join(words))
        
        # Count unique topics
        top_topics = list(set(topics))[:5]
        
        return DashboardStatsResponse(
            total_queries=stats.get('total_messages', 0),
            category_distribution=category_counts,
            recent_chats=history[:10],
            top_topics=top_topics,
            stress_predictions=0,  # Would track from separate collection
            performance_predictions=0  # Would track from separate collection
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard stats failed: {str(e)}")


# ── Legacy routes (for backward compatibility) ─────────────────────────────
@app.get("/health")
def health_check():
    """Simple health check."""
    return {"status": "ok"}


# ── Startup: Verify ML models are loaded ─────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Initialize ML predictors on startup."""
    try:
        get_predictor()
        print("✅ Category ML model loaded successfully")
    except FileNotFoundError as e:
        print(f"⚠️ Category model: {e}")
        print("💡 Run: python backend/ml/train.py")
    except Exception as e:
        print(f"⚠️ Category model error: {e}")
    
    # Initialize stress and performance models
    try:
        train_stress_model()
        print("✅ Stress prediction model loaded")
    except Exception as e:
        print(f"⚠️ Stress model error: {e}")
    
    try:
        train_performance_model()
        print("✅ Performance prediction model loaded")
    except Exception as e:
        print(f"⚠️ Performance model error: {e}")


# ── Run server ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)