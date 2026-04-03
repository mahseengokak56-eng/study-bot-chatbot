"""
performance_predictor.py — Academic Performance Prediction Model
=================================================================
Predicts student performance based on:
- attendance (0-100%)
- study_hours (0-12 per day)
- assignments_completed (0-100%)

Output: Excellent, Good, Average, Poor
"""

import pickle
import os
import numpy as np
from sklearn.ensemble import RandomForestClassifier

# Model path
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
PERFORMANCE_MODEL_PATH = os.path.join(MODEL_DIR, "performance_model.pkl")

def create_sample_data():
    """Create synthetic training data for performance prediction."""
    np.random.seed(42)
    n_samples = 600
    
    # Generate random inputs
    attendance = np.random.uniform(0, 100, n_samples)
    study_hours = np.random.uniform(0, 12, n_samples)
    assignments_completed = np.random.uniform(0, 100, n_samples)
    
    # Features matrix
    X = np.column_stack([attendance, study_hours, assignments_completed])
    
    # Calculate performance score
    # Attendance: 40%, Study hours: 35%, Assignments: 25%
    performance_scores = (
        (attendance / 100) * 0.40 +
        (study_hours / 12) * 0.35 +
        (assignments_completed / 100) * 0.25
    )
    
    # Convert to categories
    y = []
    for score in performance_scores:
        if score >= 0.85:
            y.append("Excellent")
        elif score >= 0.70:
            y.append("Good")
        elif score >= 0.50:
            y.append("Average")
        else:
            y.append("Poor")
    
    return X, np.array(y)

def train_performance_model():
    """Train and save the performance prediction model."""
    print("📊 Training Performance Prediction Model...")
    
    X, y = create_sample_data()
    
    # Use Random Forest
    model = RandomForestClassifier(n_estimators=50, max_depth=6, random_state=42)
    model.fit(X, y)
    
    # Save model
    with open(PERFORMANCE_MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    
    print(f"✅ Performance model saved to {PERFORMANCE_MODEL_PATH}")
    return model

def load_performance_model():
    """Load the performance prediction model."""
    if not os.path.exists(PERFORMANCE_MODEL_PATH):
        return train_performance_model()
    
    with open(PERFORMANCE_MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    return model

def predict_performance(attendance: float, study_hours: float, assignments_completed: float) -> dict:
    """
    Predict academic performance based on inputs.
    
    Returns:
        dict with 'level', 'confidence', 'recommendation', 'improvement_tips'
    """
    model = load_performance_model()
    
    # Prepare input
    X = np.array([[attendance, study_hours, assignments_completed]])
    
    # Predict
    prediction = model.predict(X)[0]
    probabilities = model.predict_proba(X)[0]
    confidence = max(probabilities)
    
    # Recommendations based on level
    recommendations = {
        "Excellent": "Outstanding! You're on track for great academic success. Keep up the excellent work!",
        "Good": "Good performance! With a bit more consistency, you can reach excellence.",
        "Average": "Room for improvement. Focus on weak areas to boost your performance.",
        "Poor": "Needs attention. Consider seeking help and establishing better study habits."
    }
    
    # Improvement tips based on inputs
    tips = []
    if attendance < 75:
        tips.append("Improve attendance - aim for at least 85%")
    if study_hours < 3:
        tips.append("Increase daily study time to at least 3-4 hours")
    if assignments_completed < 80:
        tips.append("Complete more assignments - they're crucial for learning")
    
    # Calculate individual scores
    attendance_score = min(100, attendance)
    study_score = min(100, (study_hours / 12) * 100)
    assignment_score = min(100, assignments_completed)
    overall_score = (attendance_score * 0.4 + study_score * 0.35 + assignment_score * 0.25)
    
    return {
        "level": prediction,
        "confidence": round(confidence * 100, 1),
        "recommendation": recommendations[prediction],
        "improvement_tips": tips if tips else ["Keep maintaining your current habits!"],
        "scores": {
            "attendance": round(attendance_score, 1),
            "study_hours": round(study_score, 1),
            "assignments": round(assignment_score, 1),
            "overall": round(overall_score, 1)
        },
        "inputs": {
            "attendance": attendance,
            "study_hours": study_hours,
            "assignments_completed": assignments_completed
        }
    }

if __name__ == "__main__":
    # Train model if run directly
    train_performance_model()
    
    # Test
    print("\n🧪 Testing predictions:")
    test_cases = [
        (90, 6, 95),   # Excellent
        (80, 4, 75),   # Good
        (65, 2, 60),   # Average
        (50, 1, 40),   # Poor
    ]
    
    for att, study, assign in test_cases:
        result = predict_performance(att, study, assign)
        print(f"\nAttendance: {att}%, Study: {study}h, Assignments: {assign}%")
        print(f"→ Performance: {result['level']} ({result['confidence']}% confidence)")
        print(f"→ Overall Score: {result['scores']['overall']}/100")
        print(f"→ {result['recommendation']}")
