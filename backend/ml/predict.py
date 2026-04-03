"""
predict.py — ML Prediction Module
=================================
Loads trained model and vectorizer to predict message categories.
"""

import os
import pickle
import re

# ── Lightweight stopwords (same as train.py) ─────────────────────────────────
STOPWORDS = {
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you",
    "your", "yours", "yourself", "he", "him", "his", "himself", "she",
    "her", "hers", "herself", "it", "its", "itself", "they", "them",
    "their", "theirs", "themselves", "what", "which", "who", "whom",
    "this", "that", "these", "those", "am", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "having", "do", "does",
    "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because",
    "as", "until", "while", "of", "at", "by", "for", "with", "about",
    "against", "between", "into", "through", "during", "before", "after",
    "above", "below", "to", "from", "up", "down", "in", "out", "on",
    "off", "over", "under", "again", "further", "then", "once", "so",
    "than", "can", "will", "just", "should", "now", "d", "ll", "m",
    "o", "re", "ve", "y", "ain", "aren", "couldn", "didn", "doesn",
    "hadn", "hasn", "haven", "isn", "ma", "mightn", "mustn", "needn",
    "shan", "shouldn", "wasn", "weren", "won", "wouldn"
}


def preprocess(text: str) -> str:
    """Lowercase, remove punctuation, remove stopwords."""
    text = text.lower()
    text = re.sub(r"[^a-z\s]", "", text)
    tokens = text.split()
    tokens = [t for t in tokens if t not in STOPWORDS]
    return " ".join(tokens)


class MLPredictor:
    """Loads and uses trained ML model for category prediction."""

    def __init__(self):
        self.model = None
        self.vectorizer = None
        self._load()

    def _load(self):
        """Load model and vectorizer from pickle files."""
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(script_dir, "model.pkl")
        vec_path = os.path.join(script_dir, "vectorizer.pkl")

        if not os.path.exists(model_path) or not os.path.exists(vec_path):
            raise FileNotFoundError(
                "Model files not found. Run 'python train.py' first to train the model."
            )

        with open(model_path, "rb") as f:
            self.model = pickle.load(f)
        with open(vec_path, "rb") as f:
            self.vectorizer = pickle.load(f)

    def predict(self, text: str) -> str:
        """Predict category for input text."""
        processed = preprocess(text)
        X = self.vectorizer.transform([processed])
        prediction = self.model.predict(X)[0]
        return prediction

    def predict_proba(self, text: str) -> dict:
        """Get prediction probabilities for all categories."""
        processed = preprocess(text)
        X = self.vectorizer.transform([processed])
        probs = self.model.predict_proba(X)[0]
        classes = self.model.classes_
        return {cls: float(prob) for cls, prob in zip(classes, probs)}


# Global predictor instance (loaded once at startup)
predictor = None


def get_predictor():
    """Get or create the global predictor instance."""
    global predictor
    if predictor is None:
        predictor = MLPredictor()
    return predictor


def predict_category(text: str) -> str:
    """Simple function to predict category from text."""
    return get_predictor().predict(text)
