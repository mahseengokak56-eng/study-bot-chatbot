"""
confusion_model.py — ML-based Confusion Detection Engine
======================================================
Detects whether a student is confused based on their chat input using
TF-IDF vectorization and Logistic Regression.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import numpy as np

class ConfusionDetector:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(lowercase=True, stop_words='english')
        self.model = LogisticRegression(class_weight='balanced', random_state=42)
        self._train_model()

    def _train_model(self):
        # Dataset of confused vs not confused phrases
        texts = [
            # Confused (Label 1)
            "I don't understand this",
            "Can you explain again?",
            "This is still confusing me",
            "I didn't get it",
            "Can you simplify this?",
            "I am stuck on this problem",
            "This is too hard",
            "I'm completely lost",
            "What does this even mean?",
            "Please explain it simpler",
            "I have no idea how to do this",
            "Why is it like this?",
            "This makes no sense to me",
            "I keep getting it wrong",
            "Help me understand",
            "Could you break it down step by step?",
            "I'm so confused right now",
            
            # Not Confused (Label 0)
            "What is photosynthesis?",
            "Tell me about cloud computing",
            "Who was Isaac Newton?",
            "Give me a quiz on history",
            "Generate notes for biology",
            "I am feeling stressed about exams",
            "How is my performance?",
            "What is the capital of France?",
            "Hi PandaBuddy!",
            "Thanks for the help",
            "I understand now",
            "That makes perfect sense",
            "Okay, got it!",
            "Let's move on to the next topic",
            "Can you give me study tips?",
            "I need a schedule for my exams",
            "Show me my dashboard"
        ]
        
        labels = [
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  # 17 confused
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0   # 17 not confused
        ]
        
        X = self.vectorizer.fit_transform(texts)
        self.model.fit(X, labels)

    def predict(self, text: str) -> dict:
        """
        Predicts if the user text indicates confusion.
        Returns a dict with 'is_confused' (bool) and 'confidence' (float).
        """
        if not text or len(text.strip()) < 3:
            return {"is_confused": False, "confidence": 0.0}
            
        X_input = self.vectorizer.transform([text])
        prediction = self.model.predict(X_input)[0]
        probabilities = self.model.predict_proba(X_input)[0]
        
        # prediction is 1 for confused, 0 for not confused
        is_confused = bool(prediction == 1)
        confidence = float(probabilities[1] if is_confused else probabilities[0])
        
        # Hardcoded fallback for exact keyword matches that might slip through TF-IDF
        lower_text = text.lower()
        confusion_keywords = ["don't understand", "dont understand", "confusing", "confused", "stuck", "explain again", "simplify", "too hard", "lost"]
        if not is_confused and any(kw in lower_text for kw in confusion_keywords):
            is_confused = True
            confidence = 0.85
            
        return {
            "is_confused": is_confused,
            "confidence": round(confidence, 2)
        }

# Singleton instance for quick access
confusion_engine = ConfusionDetector()
