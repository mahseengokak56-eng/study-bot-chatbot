# EduNova AI: Technical Architecture & Machine Learning Documentation

## 1. Project Overview
EduNova AI is an intelligent, full-stack educational platform designed to act as a personalized AI study companion. The system features a main chat interface for deep academic assistance and "PandaBuddy", an interactive 3D widget for quick, emotionally intelligent support. The project uniquely blends traditional Machine Learning (ML) algorithms with cutting-edge Large Language Models (LLMs) to provide dynamic, context-aware, and adaptive learning experiences.

---

## 2. Technologies & Stack
The project is built on a modern, decoupled architecture:

### Frontend (User Interface)
* **React.js & Vite:** Core framework for building a fast, component-driven UI.
* **Tailwind CSS:** For highly customizable, responsive, and modern styling (glassmorphism, dark mode).
* **Framer Motion:** For fluid, micro-interaction animations (typing indicators, Panda avatar movements, UI transitions).
* **Lucide React:** Iconography.

### Backend (Server & API)
* **FastAPI (Python):** High-performance, asynchronous web framework handling API routing, authentication, and ML inference.
* **MongoDB:** NoSQL database used for persistent storage of user profiles, chat histories, quiz results, and ML predictions.
* **PyJWT & bcrypt:** For secure, token-based user authentication and password hashing.

### AI & Machine Learning
* **Scikit-Learn:** Core library for traditional ML models (TF-IDF, Logistic Regression, Random Forest).
* **Groq API (LLaMA-3.1-8B):** Extremely fast LLM provider used for generative text and conversational responses.
* **LangChain:** Used to structure LLM prompts and manage conversational memory/history.

---

## 3. Functional Requirements
The platform fulfills the following core functional requirements:
1. **Authentication & User Management:** Secure login, registration, and session tracking via JWT.
2. **Dual-Chat Interface:** 
   * A **Main Chat** for deep study sessions, detailed explanations, and file-based interactions.
   * A **PandaBuddy Widget** for quick, empathetic, widget-based check-ins and study tips.
3. **Adaptive Confusion Detection:** Real-time analysis of user inputs to detect confusion, dynamically altering the UI and AI's tone to be simpler and step-by-step.
4. **Predictive Analytics:** Predicting user stress levels and future academic performance based on interaction data.
5. **Dashboard & Analytics:** Visualizing user progress, topic distribution, and quiz scores on a central dashboard.
6. **File Interactions:** Generating quizzes and summaries from uploaded PDF/TXT files.

---

## 4. Main Machine Learning Algorithms Used
EduNova AI uses a **Hybrid ML Architecture**. Instead of relying solely on an LLM for everything (which is slow and expensive), it uses fast, lightweight traditional ML models to understand the user's *intent* and *state*, and then passes that context to the LLM.

### A. TF-IDF (Term Frequency-Inverse Document Frequency)
* **Role:** Natural Language Processing (NLP) text vectorization.
* **How it works:** Converts user text messages (e.g., "I don't understand this") into mathematical arrays (vectors) based on word importance. It gives higher weight to unique keywords and ignores common filler words like "the" or "is".
* **Where it's used:** Intent classification and Confusion Detection.

### B. Logistic Regression (Classification)
* **Role:** Intent Classification & Confusion Detection.
* **How it works:** A statistical algorithm that predicts a discrete outcome. 
* **Implementation 1 (Intent):** Analyzes the TF-IDF vector of a user's message and classifies the intent into categories: `academic`, `stress`, `motivation`, `tips`, or `general`.
* **Implementation 2 (Confusion Engine):** A binary classifier trained on confused phrases vs. normal queries. It outputs a `True/False` flag and a confidence percentage indicating if the student is struggling.

### C. Random Forest Classifier
* **Role:** Stress Level Prediction.
* **How it works:** An ensemble learning method that builds multiple decision trees and merges them together for a more accurate and stable prediction.
* **Implementation:** It takes numerical inputs (Quiz Average, Total Quizzes, Recent Chat Frequency) and predicts whether the student's stress level is `High` or `Low`.

### D. Random Forest Regressor
* **Role:** Academic Performance Prediction.
* **How it works:** Similar to the classifier, but outputs a continuous numerical value instead of a category.
* **Implementation:** Predicts the student's *next* likely quiz score percentage based on their historical quiz scores and chat engagement metrics.

---

## 5. Total Working of the System (Architecture Flow)

1. **User Input:** The student types a message in the React frontend (Main Chat or PandaBuddy).
2. **API Request:** The message, along with the student's recent context (last 5 messages, current view, quiz scores), is sent securely to the FastAPI backend via a POST request (`/api/chat`).
3. **ML Pipeline Execution (The Brains):**
   * **NLP Vectorization:** The text is vectorized using TF-IDF.
   * **Intent Classification:** The Logistic Regression model categorizes the text (e.g., `academic`).
   * **Confusion Detection:** The Confusion Engine analyzes the text to see if the user is struggling (`is_confused = True/False`).
   * **Mood Detection:** Rule-based keyword matching determines the emotional mood (e.g., `frustrated`, `curious`).
4. **LLM Prompt Engineering:**
   * FastAPI constructs a massive "System Prompt" for the LLaMA model. 
   * It injects the predicted ML category, the mood, and the confusion flag. If `is_confused == True`, a strict instruction is added: *"THE STUDENT IS CONFUSED. Provide a simpler, step-by-step explanation. Be highly supportive."*
5. **Generative AI Response:** Groq processes the prompt and returns a tailored, empathetic response in milliseconds.
6. **Database Logging:** The entire interaction, along with the ML predictions and confidence scores, is saved to MongoDB (`chats` and `confusion_predictions` collections) to update the dashboard stats.
7. **UI Update:** The React frontend receives the response. If `is_confused` is true, it triggers Framer Motion animations to drop down an orange "Confusion Detected" warning badge and updates the quick-action chips to offer "Step-by-step explanation" or "Practice Quizzes". The text is then streamed to the user with a typewriter effect.
