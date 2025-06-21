from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import models
from database import SessionLocal, engine
from focus_detector import is_focused_and_emotion, should_recommend_break
import json

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/start_session/")
def start_session(db: Session = Depends(get_db)):
    session = models.StudySession(user_id="user1", start_time=datetime.utcnow())
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session_id": session.id}

@app.post("/end_session/{session_id}")
def end_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.StudySession).filter(models.StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.end_time = datetime.utcnow()
    
    # Calculate total duration
    if session.start_time and session.end_time:
        duration = (session.end_time - session.start_time).total_seconds() / 60
        session.total_duration = duration
    
    # Calculate average attention score
    attention_scores = [log.attention_score for log in session.focus_logs]
    if attention_scores:
        session.average_attention_score = sum(attention_scores) / len(attention_scores)
    
    # Calculate recommended break duration
    if session.average_attention_score is not None:
        if session.average_attention_score < 40:
            session.recommended_break_duration = 15  # 15 minutes break
        elif session.average_attention_score < 60:
            session.recommended_break_duration = 10  # 10 minutes break
        else:
            session.recommended_break_duration = 5   # 5 minutes break
    
    db.commit()
    return {"message": "Session ended successfully"}

@app.post("/analyze_focus/")
async def analyze_focus(file: UploadFile = File(...), db: Session = Depends(get_db)):
    image_data = await file.read()
    result = is_focused_and_emotion(image_data)
    
    # Placeholder for logging logic.
    # In a real app, you'd find the current session and log to it.
    
    return {
        "focused": result["focused"],
        "attention_score": result["attention_score"],
        "study_state": result["study_state"]
    }

@app.get("/session_metrics/{session_id}")
def get_session_metrics(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.StudySession).filter(models.StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    metrics = db.query(models.AttentionMetric).filter(
        models.AttentionMetric.session_id == session_id
    ).order_by(models.AttentionMetric.timestamp).all()
    
    return {
        "session_id": session.id,
        "start_time": session.start_time,
        "end_time": session.end_time,
        "total_duration": session.total_duration,
        "average_attention_score": session.average_attention_score,
        "recommended_break_duration": session.recommended_break_duration,
        "metrics": [
            {
                "timestamp": m.timestamp,
                "attention_score": m.attention_score,
                "dominant_emotion": m.dominant_emotion,
                "emotion_confidence": m.emotion_confidence,
                "break_recommended": m.break_recommended
            }
            for m in metrics
        ]
    }

@app.post("/log_focus_emotion/")
def log_focus_emotion(image_data: bytes, db: Session = Depends(get_db)):
    result = is_focused_and_emotion(image_data)
    now = datetime.utcnow()
    # This logic needs to be revisited to use an existing session_id
    session = models.StudySession(user_id="user1", start_time=now, end_time=None)
    db.add(session)
    db.commit()
    db.refresh(session)

    record = models.AttentionRecord(
        session_id=session.id,
        timestamp=now,
        emotions=result["emotions"],
        attention_score=result["attention_score"]
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    return {
        "session_id": session.id, 
        "attention_score": result["attention_score"],
        "study_state": result["study_state"]
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Focus Detection Server...")
    print("📊 API will be available at: http://127.0.0.1:8000")
    print("📖 API docs at: http://127.0.0.1:8000/docs")
    uvicorn.run(app, host="127.0.0.1", port=8000)