"""
stress_predictor.py — Stress Level Prediction Model
====================================================
Uses simple rule-based ML to predict stress levels based on:
- study_hours (0-12)
- sleep_hours (0-12)
- screen_time (0-12)

Output: Low, Medium, High
"""

import pickle
import os
import numpy as np
from sklearn.ensemble import RandomForestClassifier

# Model path
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
STRESS_MODEL_PATH = os.path.join(MODEL_DIR, "stress_model.pkl")

def create_sample_data():
    """Create synthetic training data for stress prediction."""
    np.random.seed(42)
    n_samples = 500
    
    # Generate random inputs
    study_hours = np.random.uniform(0, 12, n_samples)
    sleep_hours = np.random.uniform(0, 12, n_samples)
    screen_time = np.random.uniform(0, 12, n_samples)
    
    # Features matrix
    X = np.column_stack([study_hours, sleep_hours, screen_time])
    
    # Simple rules for stress levels:
    # High stress: high study + low sleep OR high screen time
    # Low stress: balanced lifestyle
    stress_scores = (
        (study_hours / 12) * 0.4 +  # High study contributes
        ((12 - sleep_hours) / 12) * 0.35 +  # Low sleep contributes
        (screen_time / 12) * 0.25  # High screen contributes
    )
    
    # Convert to categories
    y = []
    for score in stress_scores:
        if score < 0.4:
            y.append("Low")
        elif score < 0.7:
            y.append("Medium")
        else:
            y.append("High")
    
    return X, np.array(y)

def train_stress_model():
    """Train and save the stress prediction model."""
    print("🧠 Training Stress Prediction Model...")
    
    X, y = create_sample_data()
    
    # Use Random Forest for better performance
    model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
    model.fit(X, y)
    
    # Save model
    with open(STRESS_MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    
    print(f"✅ Stress model saved to {STRESS_MODEL_PATH}")
    return model

def load_stress_model():
    """Load the stress prediction model."""
    if not os.path.exists(STRESS_MODEL_PATH):
        return train_stress_model()
    
    with open(STRESS_MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    return model

def predict_stress(study_hours: float, sleep_hours: float, screen_time: float) -> dict:
    """
    Predict stress level based on inputs.
    
    Returns:
        dict with 'level', 'confidence', 'recommendation'
    """
    model = load_stress_model()
    
    # Prepare input
    X = np.array([[study_hours, sleep_hours, screen_time]])
    
    # Predict
    prediction = model.predict(X)[0]
    probabilities = model.predict_proba(X)[0]
    confidence = max(probabilities)
    
    # Get recommendations based on level
    recommendations = {
        "Low": "Great balance! Keep maintaining your healthy lifestyle. Consider taking on new challenges.",
        "Medium": "You're doing okay, but watch your stress signals. Try meditation or short breaks.",
        "High": "Warning: High stress detected! Prioritize sleep and reduce screen time. Consider talking to someone."
    }
    
    # Additional tips based on inputs
    tips = []
    if sleep_hours < 6:
        tips.append("Try to get at least 7-8 hours of sleep")
    if screen_time > 8:
        tips.append("Reduce screen time, take regular breaks")
    if study_hours > 10:
        tips.append("You're studying a lot! Take breaks to avoid burnout")
    
    return {
        "level": prediction,
        "confidence": round(confidence * 100, 1),
        "recommendation": recommendations[prediction],
        "tips": tips,
        "inputs": {
            "study_hours": study_hours,
            "sleep_hours": sleep_hours,
            "screen_time": screen_time
        }
    }

if __name__ == "__main__":
    # Train model if run directly
    train_stress_model()
    
    # Test
    print("\n🧪 Testing predictions:")
    test_cases = [
        (8, 7, 4),   # Balanced
        (10, 4, 8),  # High stress
        (4, 9, 2),   # Low stress
    ]
    
    for study, sleep, screen in test_cases:
        result = predict_stress(study, sleep, screen)
        print(f"\nStudy: {study}h, Sleep: {sleep}h, Screen: {screen}h")
        print(f"→ Stress Level: {result['level']} ({result['confidence']}% confidence)")
        print(f"→ {result['recommendation']}")
