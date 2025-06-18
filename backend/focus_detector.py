import cv2
import numpy as np
import tensorflow as tf
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional

# Load face detection model
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# Load emotion detection model
emotion_model_path = "models/emotion_model.h5"
emotion_model = tf.keras.models.load_model(emotion_model_path)

# Emotion labels
emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']

def preprocess_face(face_img: np.ndarray) -> np.ndarray:
    """Preprocess face image for emotion detection."""
    # Resize to model input size
    face_img = cv2.resize(face_img, (48, 48))
    # Convert to grayscale
    face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    # Normalize
    face_img = face_img.astype(np.float32) / 255.0
    # Add channel dimension
    face_img = np.expand_dims(face_img, axis=-1)
    # Add batch dimension
    face_img = np.expand_dims(face_img, axis=0)
    return face_img

def calculate_attention_score(focused: bool, emotions: Dict[str, float]) -> float:
    """Calculate attention score based on focus status and emotions."""
    if not focused:
        return 0.0
    
    # Base score from focus
    score = 50.0
    
    # Adjust based on emotions
    emotion_weights = {
        'neutral': 1.0,    # Best for studying
        'happy': 0.8,      # Good but might be distracted
        'surprise': 0.6,   # Might indicate distraction
        'fear': 0.4,       # Negative emotions
        'sad': 0.4,
        'angry': 0.3,
        'disgust': 0.3
    }
    
    # Get top emotion and its confidence
    top_emotion = max(emotions.items(), key=lambda x: x[1])
    score *= emotion_weights.get(top_emotion[0], 1.0)
    
    # Ensure score is between 0 and 100
    return min(100.0, max(0.0, score))

def should_recommend_break(attention_history: List[Tuple[datetime, float]], 
                         current_time: datetime) -> bool:
    """Determine if a break should be recommended based on attention history."""
    if len(attention_history) < 10:
        return False
    
    # Look at last 5 minutes
    five_mins_ago = current_time - timedelta(minutes=5)
    recent_scores = [score for timestamp, score in attention_history 
                    if timestamp > five_mins_ago]
    
    if not recent_scores:
        return False
    
    # Calculate average attention
    avg_attention = sum(recent_scores) / len(recent_scores)
    
    # Recommend break if average attention is below 40%
    return avg_attention < 40.0

def is_focused_and_emotion(image_data: bytes) -> Dict:
    """Detect if person is focused and their emotions."""
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Convert to grayscale for face detection
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Detect faces
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    if len(faces) == 0:
        return {
            "focused": False,
            "emotions": {},
            "attention_score": 0.0,
            "break_recommended": False
        }
    
    # Get the first face
    x, y, w, h = faces[0]
    face_img = img[y:y+h, x:x+w]
    
    # Preprocess face for emotion detection
    processed_face = preprocess_face(face_img)
    
    # Get emotion predictions using TensorFlow
    emotion_pred = emotion_model.predict(processed_face, verbose=0)
    
    # Convert predictions to dictionary
    emotions = {label: float(prob) for label, prob in zip(emotion_labels, emotion_pred[0])}
    
    # Calculate attention score
    attention_score = calculate_attention_score(True, emotions)
    
    return {
        "focused": True,
        "emotions": emotions,
        "attention_score": attention_score,
        "break_recommended": False  # This will be updated by the main API
    }
