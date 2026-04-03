# Study Bot - Hybrid ML + NLP Chatbot

A simple, stable, and easy-to-run chatbot system with ML-based intent classification, JWT authentication, and MongoDB storage.

## Features

- **ML Prediction**: Logistic Regression classifier for message categories (academic, stress, motivation, tips, general)
- **Authentication**: JWT tokens + bcrypt password hashing
- **Chatbot**: Rule-based responses with optional LLM enhancement
- **Database**: MongoDB for users and chat history

## Project Structure

```
backend/
 ├── auth/auth.py          # JWT + bcrypt authentication
 ├── db/db.py              # MongoDB operations
 ├── ml/
 │    ├── train.py         # ML model training
 │    ├── predict.py       # Prediction module
 │    ├── dataset.csv      # Training data
 ├── main.py               # FastAPI application
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file:

```env
# Required
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET_KEY=your-secret-key-here

# Optional (for LLM enhancement)
GROQ_API_KEY=your-groq-api-key
```

### 3. Train the ML Model

```bash
python backend/ml/train.py
```

This creates `model.pkl` and `vectorizer.pkl` files.

### 4. Start the Server

```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login and get token
- `GET /api/me` - Get current user profile

### Chat
- `POST /api/chat` - Send message (requires auth)
- `GET /api/history` - Get chat history (requires auth)
- `GET /api/stats` - Get user statistics (requires auth)

### Health
- `GET /` - API status
- `GET /health` - Health check

## Usage Example

### Register
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com", "password": "secret123"}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "secret123"}'
```

### Chat (with token)
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"message": "I feel stressed about exams"}'
```

## ML Categories

The model classifies messages into:
- **academic**: Questions about subjects, concepts, homework
- **stress**: Anxiety, pressure, burnout
- **motivation**: Feeling down, need encouragement
- **tips**: Study techniques, time management
- **general**: Greetings, small talk

## Response Flow

1. User sends message → ML predicts category
2. Base response generated from category templates
3. Optionally enhanced by LLM (if `use_llm: true` and API key configured)
4. Response saved to MongoDB with user_id and category
