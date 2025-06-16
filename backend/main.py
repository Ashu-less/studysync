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
    session = models.StudySession()
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
async def analyze_focus(file: UploadFile = File(...), session_id: int = None, db: Session = Depends(get_db)):
    content = await file.read()
    result = is_focused_and_emotion(content)
    
    if session_id:
        # Log focus and emotions
        log = models.FocusLog(
            session_id=session_id,
            focused=result["focused"],
            emotions=result["emotions"],
            attention_score=result["attention_score"]
        )
        db.add(log)
        
        # Get attention history for break recommendation
        attention_history = [
            (log.timestamp, log.attention_score)
            for log in db.query(models.FocusLog)
            .filter(models.FocusLog.session_id == session_id)
            .order_by(models.FocusLog.timestamp.desc())
            .limit(50)
            .all()
        ]
        
        # Update break recommendation
        result["break_recommended"] = should_recommend_break(
            attention_history,
            datetime.utcnow()
        )
        
        # Update attention metrics
        metric = models.AttentionMetric(
            session_id=session_id,
            attention_score=result["attention_score"],
            dominant_emotion=max(result["emotions"].items(), key=lambda x: x[1])[0],
            emotion_confidence=max(result["emotions"].values()),
            focus_duration=5.0,  # 5-minute intervals
            break_recommended=result["break_recommended"]
        )
        db.add(metric)
        db.commit()
    
    return result

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