from fastapi import FastAPI
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# FastAPI app
app = FastAPI()

# LLM setup
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.1-8b-instant"
)

# MongoDB connection
client = MongoClient(os.getenv("MONGODB_URI"))
db = client["studybot_db"]
collection = db["chat_history"]

# System prompt
system_prompt = """
You are Study Bot, an AI assistant designed to help students with academic questions.
Explain concepts clearly and in simple terms.
Only answer study or learning related questions.
"""

@app.get("/")
def home():
    return {"message": "Study Bot API is running"}

@app.post("/chat")
def chat(user_message: str):

    # Retrieve last 5 messages for context
    history = list(collection.find().sort("_id", -1).limit(5))

    previous_messages = ""

    for chat in reversed(history):
        previous_messages += f"User: {chat['user']}\nBot: {chat['bot']}\n"

    # Build prompt
    prompt = system_prompt + "\n" + previous_messages + "\nUser: " + user_message

    # Generate response
    response = llm.invoke([
        HumanMessage(content=prompt)
    ])

    bot_reply = response.content

    # Store conversation
    collection.insert_one({
        "user": user_message,
        "bot": bot_reply
    })

    return {"response": bot_reply}