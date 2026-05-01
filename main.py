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
    save_chat, get_chat_history, get_user_stats,
    save_stress_prediction, save_performance_prediction,
    get_stress_prediction_count, get_performance_prediction_count,
    save_quiz_result, get_quiz_results, get_quiz_stats,
    save_notes_history, get_notes_history,
    save_uploaded_files, get_user_files
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
        # Save prediction to database
        save_stress_prediction(
            user_id=current_user.user_id,
            inputs={
                "study_hours": request.study_hours,
                "sleep_hours": request.sleep_hours,
                "screen_time": request.screen_time
            },
            result=result
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
        # Save prediction to database
        save_performance_prediction(
            user_id=current_user.user_id,
            inputs={
                "attendance": request.attendance,
                "study_hours": request.study_hours,
                "assignments_completed": request.assignments_completed
            },
            result=result
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

IMPORTANT: Vary the correct answers among A, B, C, and D. Do NOT always make A the correct answer. Use each letter roughly equally across all questions.

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
        
        # Format questions properly - convert letter answer to text
        formatted_questions = []
        for q in questions[:request.num_questions]:
            options = q.get('options', ['A', 'B', 'C', 'D'])
            correct = q.get('correct_answer', 'A').strip().upper()
            # Convert letter (A/B/C/D) to option text
            letter_to_idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
            correct_idx = letter_to_idx.get(correct, 0)
            correct_text = options[correct_idx] if correct_idx < len(options) else options[0]
            
            formatted_questions.append(QuizQuestion(
                question=q.get('question', 'Sample question'),
                options=options,
                correct_answer=correct_text,
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
    total_quizzes: int
    quiz_average: float
    quiz_best_score: float

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
        
        # Get prediction counts from database
        stress_count = get_stress_prediction_count(current_user.user_id)
        perf_count = get_performance_prediction_count(current_user.user_id)
        
        # Get quiz stats
        quiz_stats = get_quiz_stats(current_user.user_id)
        
        return DashboardStatsResponse(
            total_queries=stats.get('total_chats', 0),
            category_distribution=category_counts,
            recent_chats=history[:10],
            top_topics=top_topics,
            stress_predictions=stress_count,
            performance_predictions=perf_count,
            total_quizzes=quiz_stats.get('total_quizzes', 0),
            quiz_average=quiz_stats.get('average_percentage', 0),
            quiz_best_score=quiz_stats.get('best_score', 0)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard stats failed: {str(e)}")


# ── File Upload API ──────────────────────────────────────────────────────────
from fastapi import File, UploadFile
from typing import List
import io

# Try to import PDF and DOCX extractors
try:
    import PyPDF2
    PYPDF2_SUPPORT = True
except ImportError:
    PYPDF2_SUPPORT = False

try:
    import pdfplumber
    PDFPLUMBER_SUPPORT = True
except ImportError:
    PDFPLUMBER_SUPPORT = False

# Combined PDF support
PDF_SUPPORT = PYPDF2_SUPPORT or PDFPLUMBER_SUPPORT

def extract_pdf_text(content: bytes, filename: str) -> str:
    """Extract text from PDF using multiple methods."""
    text = ""
    
    # Method 1: Try pdfplumber (best for structured PDFs)
    if PDFPLUMBER_SUPPORT:
        try:
            pdf_file = io.BytesIO(content)
            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            
            # Validate extraction - if we got meaningful text, return it
            if len(text.strip()) > 50:
                print(f"pdfplumber successfully extracted {len(text)} chars from {filename}")
                return text[:3000]
        except Exception as e:
            print(f"pdfplumber extraction failed: {e}")
    
    # Method 2: Try PyPDF2
    if PYPDF2_SUPPORT:
        try:
            text = ""
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                except Exception as e:
                    print(f"Error extracting page {page_num}: {e}")
                    continue
            
            # Validate extraction
            if len(text.strip()) > 50:
                print(f"PyPDF2 successfully extracted {len(text)} chars from {filename}")
                return text[:3000]
        except Exception as e:
            print(f"PyPDF2 extraction failed: {e}")
    
    # If both methods failed or returned minimal text
    if len(text.strip()) < 50:
        print(f"Warning: PDF {filename} may be scanned or image-based. Minimal text extracted.")
        return f"[PDF file: {filename} - Content appears to be scanned/images. Please upload text-based PDFs for best results.]"
    
    return text[:3000] if text else f"[PDF file: {filename}]"

try:
    import docx
    DOCX_SUPPORT = True
except ImportError:
    DOCX_SUPPORT = False

class FileUploadResponse(BaseModel):
    file_ids: List[str]
    files: List[dict]
    message: str

def extract_text_from_file(content: bytes, filename: str, content_type: str) -> str:
    """Extract text content from various file types."""
    text = ""
    filename_lower = filename.lower()
    
    # Text files
    if content_type and content_type.startswith('text/'):
        text = content.decode('utf-8', errors='ignore')
    elif filename_lower.endswith(('.txt', '.md', '.py', '.js', '.html', '.css', '.json', '.xml')):
        text = content.decode('utf-8', errors='ignore')
    
    # PDF files - try multiple methods
    elif filename_lower.endswith('.pdf'):
        text = extract_pdf_text(content, filename)
    
    elif filename_lower.endswith('.pdf') and not PDF_SUPPORT:
        text = f"[PDF file: {filename} - install PyPDF2 or pdfplumber for text extraction]"
    
    # Word documents
    elif filename_lower.endswith('.docx') and DOCX_SUPPORT:
        try:
            doc_file = io.BytesIO(content)
            doc = docx.Document(doc_file)
            for para in doc.paragraphs:
                if para.text:
                    text += para.text + "\n"
        except Exception as e:
            print(f"DOCX extraction error: {e}")
            text = f"[DOCX file: {filename}]"
    elif filename_lower.endswith('.docx') and not DOCX_SUPPORT:
        text = f"[DOCX file: {filename} - install python-docx for text extraction]"
    
    # Images - use filename as hint since we can't extract text without OCR
    elif filename_lower.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp')):
        text = f"[Image file: {filename}]"
    
    # Return first 2000 chars for preview
    return text[:2000] if text else ""

@app.post("/api/upload", response_model=FileUploadResponse)
async def upload_files(
    files: List[UploadFile] = File(...),
    current_user: TokenData = Depends(get_current_user)
):
    """Upload files (images, documents) for quiz or notes generation."""
    try:
        uploaded_files = []
        
        for file in files:
            # Read file content
            content = await file.read()
            
            # Extract text content using our new function
            content_preview = extract_text_from_file(content, file.filename, file.content_type)
            
            file_info = {
                "filename": file.filename,
                "content_type": file.content_type or "application/octet-stream",
                "size": len(content),
                "content_preview": content_preview
            }
            uploaded_files.append(file_info)
            print(f"Uploaded: {file.filename} ({len(content)} bytes), preview: {len(content_preview)} chars")
        
        # Save file metadata to database
        file_ids = save_uploaded_files(current_user.user_id, uploaded_files)
        
        return FileUploadResponse(
            file_ids=file_ids,
            files=uploaded_files,
            message=f"Successfully uploaded {len(files)} file(s)"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


# ── Quiz Results API ─────────────────────────────────────────────────────────
class QuizResultRequest(BaseModel):
    topic: str
    difficulty: str
    score: int
    total_questions: int

class QuizResultResponse(BaseModel):
    result_id: str
    message: str

@app.post("/api/quiz-result", response_model=QuizResultResponse)
async def save_quiz_result_endpoint(
    request: QuizResultRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Save quiz result after completion."""
    try:
        quiz_data = {
            "topic": request.topic,
            "difficulty": request.difficulty
        }
        result_id = save_quiz_result(
            user_id=current_user.user_id,
            quiz_data=quiz_data,
            score=request.score,
            total_questions=request.total_questions
        )
        return QuizResultResponse(
            result_id=result_id,
            message="Quiz result saved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save quiz result: {str(e)}")


class QuizStatsResponse(BaseModel):
    total_quizzes: int
    average_percentage: float
    best_score: float
    recent_results: List[dict]
    improvement: dict

@app.get("/api/quiz-stats", response_model=QuizStatsResponse)
async def get_quiz_stats_endpoint(current_user: TokenData = Depends(get_current_user)):
    """Get quiz statistics including improvement tracking."""
    try:
        stats = get_quiz_stats(current_user.user_id)
        results = get_quiz_results(current_user.user_id, limit=10)
        
        # Calculate improvement trend
        improvement = {"trend": "stable", "change": 0}
        if len(results) >= 2:
            recent_avg = sum(r.get("percentage", 0) for r in results[-3:]) / min(3, len(results[-3:]))
            older_avg = sum(r.get("percentage", 0) for r in results[:max(1, len(results)-3)]) / max(1, len(results)-3)
            change = recent_avg - older_avg
            improvement = {
                "trend": "improving" if change > 5 else "declining" if change < -5 else "stable",
                "change": round(change, 2)
            }
        
        return QuizStatsResponse(
            total_quizzes=stats["total_quizzes"],
            average_percentage=stats["average_percentage"],
            best_score=stats["best_score"],
            recent_results=stats["recent_results"],
            improvement=improvement
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get quiz stats: {str(e)}")


# ── Quiz with Files API ────────────────────────────────────────────────────
class QuizWithFilesRequest(BaseModel):
    file_ids: List[str]
    difficulty: str = "medium"
    num_questions: int = 5

@app.post("/api/quiz-from-files", response_model=QuizResponse)
async def generate_quiz_from_files(
    request: QuizWithFilesRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Generate a quiz based on uploaded file content."""
    try:
        # Get user's uploaded files
        user_files = get_user_files(current_user.user_id)
        
        # Filter files by provided IDs
        selected_files = [f for f in user_files if f.get("_id") in request.file_ids or f.get("file_id") in request.file_ids]
        
        # Combine content from files
        combined_content = ""
        for file in selected_files[:3]:  # Limit to first 3 files
            preview = file.get("content_preview", "")
            if preview:
                combined_content += f"\n\n--- Content from {file.get('filename', 'document')} ---\n{preview}"
        
        if not combined_content:
            # Fallback to generic quiz if no content
            return await generate_quiz(
                request=QuizRequest(topic="General Knowledge", difficulty=request.difficulty, num_questions=request.num_questions),
                current_user=current_user
            )
        
        if not llm:
            # Fallback if LLM not available
            return QuizResponse(
                topic="Content from Uploaded Files",
                questions=[
                    QuizQuestion(
                        question="What is the main topic covered in the uploaded files?",
                        options=["Science", "Technology", "History", "General Knowledge"],
                        correct_answer="General Knowledge",
                        explanation="This is a sample question based on your uploaded content."
                    )
                ],
                total_questions=1
            )
        
        # Generate quiz using LLM based on file content
        system_msg = f"""Based on the following content, create {request.num_questions} multiple choice questions at {request.difficulty} difficulty level.

IMPORTANT: Vary the correct answers among A, B, C, and D. Do NOT always make A the correct answer.

CONTENT:
{combined_content[:3000]}

Format each question as:
Q: [Question text]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
Correct: [A/B/C/D]
Explanation: [Brief explanation]

Make questions based specifically on the provided content."""

        messages = [
            SystemMessage(content=system_msg),
            HumanMessage(content="Generate a quiz based on this content")
        ]
        
        response = llm.invoke(messages)
        
        # Parse questions
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
        
        # Format properly - convert letter answer to text
        formatted_questions = []
        for q in questions[:request.num_questions]:
            options = q.get('options', ['A', 'B', 'C', 'D'])
            correct = q.get('correct_answer', 'A').strip().upper()
            # Convert letter (A/B/C/D) to option text
            letter_to_idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
            correct_idx = letter_to_idx.get(correct, 0)
            correct_text = options[correct_idx] if correct_idx < len(options) else options[0]
            
            formatted_questions.append(QuizQuestion(
                question=q.get('question', 'Sample question'),
                options=options,
                correct_answer=correct_text,
                explanation=q.get('explanation', 'No explanation available.')
            ))
        
        return QuizResponse(
            topic="Quiz from Uploaded Files",
            questions=formatted_questions,
            total_questions=len(formatted_questions)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation from files failed: {str(e)}")


# ── Notes with Files API ───────────────────────────────────────────────────
class NotesWithFilesRequest(BaseModel):
    file_ids: List[str]
    detail_level: str = "medium"

@app.post("/api/notes-from-files", response_model=NotesResponse)
async def generate_notes_from_files(
    request: NotesWithFilesRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Generate notes based on uploaded file content."""
    try:
        # Get user's uploaded files
        user_files = get_user_files(current_user.user_id)
        
        # Filter files by provided IDs
        selected_files = [f for f in user_files if f.get("_id") in request.file_ids or f.get("file_id") in request.file_ids]
        
        # Combine content from files
        combined_content = ""
        file_names = []
        for file in selected_files[:3]:  # Limit to first 3 files
            preview = file.get("content_preview", "")
            if preview:
                combined_content += f"\n\n--- {file.get('filename', 'Document')} ---\n{preview}"
                file_names.append(file.get('filename', 'Document'))
        
        if not combined_content:
            raise HTTPException(status_code=400, detail="No content found in selected files")
        
        if not llm:
            # Fallback if LLM not available
            return NotesResponse(
                topic="Content from Uploaded Files",
                heading=f"Notes: {', '.join(file_names[:2])}",
                key_points=["Key point extracted from your files", "Another important concept"],
                summary="These are notes generated from your uploaded content.",
                full_content=f"# Notes from Uploaded Files\n\n{combined_content[:1000]}"
            )
        
        # Generate notes using LLM
        detail_instruction = {
            "brief": "Provide a brief overview with 3-4 key points",
            "medium": "Provide a comprehensive overview with 5-7 key points",
            "detailed": "Provide detailed notes with 8-10 key points and examples"
        }
        
        system_msg = f"""Based on the following content, create structured study notes.

CONTENT:
{combined_content[:4000]}

{detail_instruction[request.detail_level]}

Format your response as:
HEADING: [Descriptive heading based on content]

KEY POINTS:
• [Point 1]
• [Point 2]
• [Point 3]
...

SUMMARY:
[2-3 sentence summary]

FULL NOTES:
[Detailed content in markdown format based on the provided files]"""

        messages = [
            SystemMessage(content=system_msg),
            HumanMessage(content="Generate study notes from this content")
        ]
        
        response = llm.invoke(messages)
        content = response.content
        
        # Parse response
        heading = "Notes from Files"
        key_points = []
        summary = ""
        
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
            key_points = ["Important concept from files", "Key information extracted"]
        if not summary:
            summary = "These notes summarize the content from your uploaded files."
        
        result = NotesResponse(
            topic="Notes from Uploaded Files",
            heading=heading,
            key_points=key_points[:10],
            summary=summary.strip(),
            full_content=content
        )
        
        # Save to history
        file_ids_only = [f.get("_id") or f.get("file_id") for f in selected_files]
        save_notes_history(
            user_id=current_user.user_id,
            topic=heading,
            detail_level=request.detail_level,
            notes_content={
                "heading": heading,
                "key_points": key_points,
                "summary": summary.strip()
            },
            uploaded_files=file_ids_only
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notes generation from files failed: {str(e)}")


# ── Quiz & Notes History API ─────────────────────────────────────────────────
@app.get("/api/quiz-history")
async def get_quiz_history_endpoint(
    limit: int = 20,
    current_user: TokenData = Depends(get_current_user)
):
    """Get quiz history for the user."""
    try:
        history = get_quiz_results(current_user.user_id, limit=limit)
        return {"quiz_history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get quiz history: {str(e)}")


@app.get("/api/notes-history")
async def get_notes_history_endpoint(
    limit: int = 20,
    current_user: TokenData = Depends(get_current_user)
):
    """Get notes generation history for the user."""
    try:
        history = get_notes_history(current_user.user_id, limit=limit)
        return {"notes_history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get notes history: {str(e)}")


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


# ── NLP-based Topic Extraction & Recommendation System ────────────────────
import re
from collections import Counter

# Common stopwords to filter out
STOPWORDS = {
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
    'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'and', 'but', 'or', 'yet', 'so', 'if',
    'because', 'although', 'though', 'while', 'where', 'when', 'that',
    'which', 'who', 'whom', 'whose', 'what', 'this', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
    'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves',
    'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these',
    'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'explain',
    'tell', 'describe', 'what', 'how', 'why', 'when', 'where', 'who'
}

def extract_topics(text: str, max_topics: int = 3) -> List[str]:
    """Extract main topics from text using simple NLP (keyword extraction)."""
    if not text:
        return []
    
    # Clean and tokenize
    text = re.sub(r'[^\w\s]', ' ', text.lower())
    words = text.split()
    
    # Filter stopwords and short words
    filtered = [w for w in words if w not in STOPWORDS and len(w) > 2]
    
    # Count word frequency
    word_counts = Counter(filtered)
    
    # Get top topics
    top_words = word_counts.most_common(max_topics)
    
    # Capitalize and return
    topics = [word.title() for word, count in top_words]
    return topics

class RecommendationResponse(BaseModel):
    recommendations: List[str]
    extracted_topics: List[str]
    based_on: dict

@app.get("/api/recommendations", response_model=RecommendationResponse)
async def get_recommendations(current_user: TokenData = Depends(get_current_user)):
    """Generate personalized study recommendations based on user activity."""
    try:
        recommendations = []
        extracted_topics = []
        based_on = {
            "recent_chats": 0,
            "quiz_performance": None,
            "stress_level": None,
            "weak_topics": [],
            "strong_topics": []
        }
        
        # 1. Analyze recent chat history
        try:
            chat_history = list(chat_history_collection.find(
                {"user_id": current_user.user_id}
            ).sort("timestamp", -1).limit(10))
            
            based_on["recent_chats"] = len(chat_history)
            
            # Extract topics from chat messages
            for chat in chat_history:
                message = chat.get("message", "")
                topics = extract_topics(message, max_topics=2)
                extracted_topics.extend(topics)
                
        except Exception as e:
            print(f"Chat analysis error: {e}")
        
        # 2. Analyze quiz performance
        try:
            quiz_results = list(quiz_results_collection.find(
                {"user_id": current_user.user_id}
            ).sort("timestamp", -1).limit(5))
            
            if quiz_results:
                scores = [r.get("score", 0) / r.get("total_questions", 1) * 100 for r in quiz_results]
                avg_score = sum(scores) / len(scores)
                based_on["quiz_performance"] = round(avg_score, 1)
                
                # Identify weak and strong topics
                for result in quiz_results:
                    topic = result.get("topic", "")
                    score_pct = result.get("score", 0) / result.get("total_questions", 1) * 100
                    
                    if score_pct < 50:
                        based_on["weak_topics"].append(topic)
                        recommendations.append(f'📚 Revise "{topic}" - Your score was {score_pct:.0f}%')
                    elif score_pct > 80:
                        based_on["strong_topics"].append(topic)
                        recommendations.append(f'🌟 Great job on "{topic}"! Try a harder difficulty!')
                        
        except Exception as e:
            print(f"Quiz analysis error: {e}")
        
        # 3. Check stress level
        try:
            stress_data = stress_collection.find_one(
                {"user_id": current_user.user_id},
                sort=[("timestamp", -1)]
            )
            
            if stress_data:
                stress_level = stress_data.get("stress_level", "Medium")
                based_on["stress_level"] = stress_level
                
                if stress_level == "High":
                    recommendations.append("💆 Take a short break! Your stress level is high.")
                    recommendations.append("🧘 Try deep breathing exercises for 2 minutes.")
                elif stress_level == "Low" and based_on.get("quiz_performance", 0) > 70:
                    recommendations.append("🚀 You're in great shape! Ready to tackle new topics!")
                    
        except Exception as e:
            print(f"Stress analysis error: {e}")
        
        # 4. Generate general recommendations based on topics
        unique_topics = list(set(extracted_topics))[:5]
        
        if unique_topics:
            based_on["extracted_topics"] = unique_topics
            
            if len(unique_topics) >= 2:
                recommendations.append(f"🎯 Try connecting {' and '.join(unique_topics[:2])} concepts!")
            
            for topic in unique_topics[:2]:
                if topic not in based_on.get("weak_topics", []) and topic not in based_on.get("strong_topics", []):
                    recommendations.append(f"📖 Generate study notes for {topic}")
                    recommendations.append(f"🎮 Take a quiz on {topic} to test your knowledge!")
        
        # 5. Default recommendations if none generated
        if not recommendations:
            recommendations = [
                "💡 Start by asking a question about any topic you're studying!",
                "🎯 Take a quiz to test your current knowledge level.",
                "📝 Upload study materials to generate personalized notes."
            ]
        
        # Remove duplicates while preserving order
        seen = set()
        unique_recommendations = []
        for rec in recommendations:
            if rec not in seen:
                seen.add(rec)
                unique_recommendations.append(rec)
        
        return RecommendationResponse(
            recommendations=unique_recommendations[:5],
            extracted_topics=unique_topics,
            based_on=based_on
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")

# ── Run server ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)