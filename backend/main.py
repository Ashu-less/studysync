# main.py
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import models
from database import SessionLocal, engine
from focus_detector import is_focused_and_emotion, should_recommend_break, map_emotion_to_study_state
import json
from typing import List, Optional

# Create database tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware to allow requests from your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development. In production, specify your frontend's origin.
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/start_session/")
def start_session(db: Session = Depends(get_db)):
    """
    Starts a new study session for a user.
    Returns the session_id.
    """
    # For now, user_id is hardcoded. In a real app, you'd get this from authentication.
    session = models.StudySession(user_id="user1", start_time=datetime.utcnow())
    db.add(session)
    db.commit()
    db.refresh(session)
    print(f"Session started: ID {session.id} at {session.start_time}")
    return {"session_id": session.id}

@app.post("/end_session/{session_id}")
def end_session(session_id: int, db: Session = Depends(get_db)):
    """
    Ends an existing study session, calculates duration, average attention,
    and recommends a break.
    """
    session = db.query(models.StudySession).filter(models.StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.end_time = datetime.utcnow()

    # Calculate total duration
    if session.start_time and session.end_time:
        duration = (session.end_time - session.start_time).total_seconds() / 60
        session.total_duration = duration

    # Get all attention records for this session to calculate average attention score
    attention_records = db.query(models.AttentionMetric).filter(
        models.AttentionMetric.session_id == session_id
    ).all()
    
    attention_scores = [record.attention_score for record in attention_records if record.attention_score is not None]
    if attention_scores:
        session.average_attention_score = sum(attention_scores) / len(attention_scores)
    else:
        session.average_attention_score = 0.0 # Default if no scores recorded

    # Calculate recommended break duration based on average attention score
    if session.average_attention_score is not None:
        if session.average_attention_score < 40:
            session.recommended_break_duration = 15  # 15 minutes break for low attention
        elif session.average_attention_score < 60:
            session.recommended_break_duration = 10  # 10 minutes break for moderate attention
        else:
            session.recommended_break_duration = 5   # 5 minutes break for high attention
    else:
        session.recommended_break_duration = 5 # Default break

    db.commit()
    db.refresh(session)
    print(f"Session {session_id} ended. Duration: {session.total_duration:.1f} mins, Avg Attention: {session.average_attention_score:.1f}%")
    return {"message": "Session ended successfully", "session_summary": {
        "total_duration": session.total_duration,
        "average_attention_score": session.average_attention_score,
        "recommended_break_duration": session.recommended_break_duration
    }}

@app.post("/analyze_focus/")
async def analyze_focus(
    file: UploadFile = File(...),
    session_id: int = Query(..., description="The ID of the current study session"),
    db: Session = Depends(get_db)
):
    """
    Analyzes an image for focus and emotion, logs the metric, and returns real-time feedback.
    The image is expected as 'multipart/form-data' with the field name 'file'.
    The session_id should be provided as a query parameter.
    """
    image_data = await file.read()
    
    # Use the local focus_detector which includes emotion detection and attention scoring
    analysis_result = is_focused_and_emotion(image_data)
    
    # Retrieve the session to link the metric
    session = db.query(models.StudySession).filter(models.StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found for logging focus.")

    now = datetime.utcnow()
    
    # Store attention history for break recommendation logic (if needed for more complex logic)
    # This example directly uses the current attention score.
    
    # Determine dominant emotion and its confidence
    dominant_emotion = None
    emotion_confidence = 0.0
    if analysis_result["emotions"]:
        dominant_emotion_item = max(analysis_result["emotions"].items(), key=lambda x: x[1])
        dominant_emotion = dominant_emotion_item[0]
        emotion_confidence = dominant_emotion_item[1]
    
    # Create and save a new AttentionMetric record
    attention_metric = models.AttentionMetric(
        session_id=session_id,
        timestamp=now,
        attention_score=analysis_result["attention_score"],
        dominant_emotion=dominant_emotion,
        emotion_confidence=emotion_confidence,
        focus_duration=0, # This can be calculated or updated later if needed
        break_recommended=False # This logic can be integrated here based on attention history
    )
    db.add(attention_metric)
    db.commit()
    db.refresh(attention_metric)
    
    print(f"Logged attention for session {session_id}: Score={analysis_result['attention_score']:.1f}, State={analysis_result['study_state']}")

    return {
        "focused": analysis_result["focused"],
        "attention_score": analysis_result["attention_score"],
        "study_state": analysis_result["study_state"],
        "dominant_emotion": dominant_emotion,
        "emotion_confidence": emotion_confidence,
        "break_recommended": analysis_result["break_recommended"] # From focus_detector
    }

@app.get("/sessions/", response_model=List[dict])
def get_all_sessions(db: Session = Depends(get_db)):
    """
    Retrieves a list of all study sessions with their summary data.
    """
    sessions = db.query(models.StudySession).all()
    # Serialize sessions to a format that can be returned as JSON
    session_list = []
    for session in sessions:
        session_list.append({
            "id": session.id,
            "user_id": session.user_id,
            "start_time": session.start_time.isoformat() if session.start_time else None,
            "end_time": session.end_time.isoformat() if session.end_time else None,
            "total_duration": session.total_duration,
            "average_attention_score": session.average_attention_score,
            "recommended_break_duration": session.recommended_break_duration,
        })
    return session_list


@app.get("/session_metrics/{session_id}")
def get_session_metrics(session_id: int, db: Session = Depends(get_db)):
    """
    Retrieves detailed metrics for a specific study session.
    """
    session = db.query(models.StudySession).filter(models.StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    metrics = db.query(models.AttentionMetric).filter(
        models.AttentionMetric.session_id == session_id
    ).order_by(models.AttentionMetric.timestamp).all()

    return {
        "session_id": session.id,
        "start_time": session.start_time.isoformat() if session.start_time else None,
        "end_time": session.end_time.isoformat() if session.end_time else None,
        "total_duration": session.total_duration,
        "average_attention_score": session.average_attention_score,
        "recommended_break_duration": session.recommended_break_duration,
        "metrics": [
            {
                "timestamp": m.timestamp.isoformat() if m.timestamp else None,
                "attention_score": m.attention_score,
                "dominant_emotion": m.dominant_emotion,
                "emotion_confidence": m.emotion_confidence,
                "break_recommended": m.break_recommended
            }
            for m in metrics
        ]
    }

# Removed the /log_focus_emotion/ endpoint as its functionality is now integrated into /analyze_focus/
# @app.post("/log_focus_emotion/")
# def log_focus_emotion(image_data: bytes, db: Session = Depends(get_db)):
#     # ... logic moved to analyze_focus ...

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting StudySync FastAPI Server...")
    print("📊 API will be available at: http://127.0.0.1:8000")
    print("📖 API docs at: http://127.0.0.1:8000/docs")
    # Make sure your Flask server (emotion_api.py) is also running on port 5001
    uvicorn.run(app, host="127.0.0.1", port=8000)
