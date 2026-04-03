"""
train.py — ML Training Script
==============================
Trains a Logistic Regression classifier on the dataset.csv file.
Uses TF-IDF vectorization with basic NLP preprocessing.
Saves the trained model and vectorizer as pickle files.

Usage:
    python train.py
"""

import os
import pickle
import re
import csv

# ── Lightweight stopwords list (no NLTK download needed) ──────────────────────
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
    text = re.sub(r"[^a-z\s]", "", text)  # remove non-alpha characters
    tokens = text.split()
    tokens = [t for t in tokens if t not in STOPWORDS]
    return " ".join(tokens)


def load_dataset(csv_path: str):
    """Load dataset from CSV file. Returns (texts, labels) lists."""
    texts, labels = [], []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            text = row["text"].strip().strip('"')
            category = row["category"].strip()
            if text and category:
                texts.append(preprocess(text))
                labels.append(category)
    return texts, labels


def train():
    """Train TF-IDF + Logistic Regression and save model files."""
    # Use sklearn for TF-IDF and Logistic Regression
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, accuracy_score

    # ── Paths ──────────────────────────────────────────────────────────────────
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path   = os.path.join(script_dir, "dataset.csv")
    model_path = os.path.join(script_dir, "model.pkl")
    vec_path   = os.path.join(script_dir, "vectorizer.pkl")

    print("📂 Loading dataset...")
    texts, labels = load_dataset(csv_path)
    print(f"   ✅ Loaded {len(texts)} samples across categories: {set(labels)}")

    # ── TF-IDF Vectorization ───────────────────────────────────────────────────
    print("\n🔢 Vectorizing with TF-IDF...")
    vectorizer = TfidfVectorizer(
        max_features=500,    # keep top 500 features — lightweight
        ngram_range=(1, 2),  # unigrams + bigrams for better context
        min_df=1,
    )
    X = vectorizer.fit_transform(texts)
    y = labels

    # ── Train / Test split ────────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── Logistic Regression ───────────────────────────────────────────────────
    print("\n🤖 Training Logistic Regression model...")
    model = LogisticRegression(max_iter=1000, C=1.0, solver="lbfgs")
    model.fit(X_train, y_train)

    # ── Evaluate ──────────────────────────────────────────────────────────────
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n📊 Accuracy: {acc * 100:.1f}%")
    print("\n📋 Classification Report:")
    print(classification_report(y_test, y_pred))

    # ── Save model + vectorizer ───────────────────────────────────────────────
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    with open(vec_path, "wb") as f:
        pickle.dump(vectorizer, f)

    print(f"\n✅ Model saved   → {model_path}")
    print(f"✅ Vectorizer saved → {vec_path}")
    print("\n🎉 Training complete! You can now start the FastAPI server.")


if __name__ == "__main__":
    train()
