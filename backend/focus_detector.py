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

def map_emotion_to_study_state(emotion: str) -> str:
    mapping = {
        'angry': 'Frustrated',
        'disgust': 'Frustrated',
        'fear': 'Anxious / Overwhelmed',
        'sad': 'Anxious / Overwhelmed',
        'neutral': 'Zoned Out / Passive',
        'happy': 'Motivated / Engaged',
        'surprise': 'Distracted / Alert',
    }
    return mapping.get(emotion, 'Unknown')

def preprocess_face(face_img: np.ndarray) -> np.ndarray:
    """Preprocess face image for emotion detection."""
    face_img = cv2.resize(face_img, (48, 48))
    face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    face_img = face_img.astype(np.float32) / 255.0
    face_img = np.expand_dims(face_img, axis=-1)
    face_img = np.expand_dims(face_img, axis=0)
    return face_img

def calculate_attention_score(focused: bool, emotions: Dict[str, float]) -> float:
    """Calculate attention score based on focus status and emotions."""
    if not focused:
        return 0.0
    
    score = 50.0
    
    emotion_weights = {
        'neutral': 1.0,    # Best for studying
        'happy': 0.8,      # Good but might be distracted
        'surprise': 0.6,   # Might indicate distraction
        'fear': 0.4,       # Negative emotions
        'sad': 0.4,
        'angry': 0.3,
        'disgust': 0.3
    }
    
    top_emotion = max(emotions.items(), key=lambda x: x[1])
    score *= emotion_weights.get(top_emotion[0], 1.0)
    
    return min(100.0, max(0.0, score))

def should_recommend_break(attention_history: List[Tuple[datetime, float]], 
                         current_time: datetime) -> bool:
    """Determine if a break should be recommended based on attention history."""
    if len(attention_history) < 10:
        return False
    
    five_mins_ago = current_time - timedelta(minutes=5)
    recent_scores = [score for timestamp, score in attention_history 
                    if timestamp > five_mins_ago]
    
    if not recent_scores:
        return False
    
    avg_attention = sum(recent_scores) / len(recent_scores)
    
    return avg_attention < 40.0

def is_focused_and_emotion(image_data: bytes) -> Dict:
    """Detect if person is focused and their emotions."""
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    if len(faces) == 0:
        return {
            "focused": False,
            "emotions": {},
            "attention_score": 0.0,
            "break_recommended": False,
            "study_state": None
        }
    
    x, y, w, h = faces[0]
    face_img = img[y:y+h, x:x+w]
    
    processed_face = preprocess_face(face_img)
    
    emotion_pred = emotion_model.predict(processed_face, verbose=0)
    
    emotions = {label: float(prob) for label, prob in zip(emotion_labels, emotion_pred[0])}
    
    attention_score = calculate_attention_score(True, emotions)
    
    top_emotion = max(emotions.items(), key=lambda x: x[1])[0]
    study_state = map_emotion_to_study_state(top_emotion)
    
    return {
        "focused": True,
        "emotions": emotions,
        "attention_score": attention_score,
        "break_recommended": False,
        "study_state": study_state
    }
