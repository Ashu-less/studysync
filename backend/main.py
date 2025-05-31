from fastapi import FastAPI, UploadFile, File
from fastapi import Depends

from fastapi.middleware.cors import CORSMiddleware
from focus_detector import is_focused

from database import Base, engine, SessionLocal
from sqlalchemy.orm import Session
import models
from datetime import datetime

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/start_session")
def start_session(db: Session = Depends(get_db)):
    session = models.StudySession()
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session_id": session.id, "start_time": session.start_time}

@app.post("/log_focus")
def log_focus(session_id: int, focused: bool, db: Session = Depends(get_db)):
    log = models.FocusLog(session_id=session_id, focused=focused)
    db.add(log)
    db.commit()
    return {"message": "Focus log saved"}

@app.post("/end_session")
def end_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.StudySession).filter(models.StudySession.id == session_id).first()
    if not session:
        return {"error": "Session not found"}
    session.end_time = datetime.utcnow()
    db.commit()
    logs = db.query(models.FocusLog).filter(models.FocusLog.session_id == session_id).all()
    total = len(logs)
    focused = sum(1 for log in logs if log.focused)
    focus_percent = (focused / total) * 100 if total > 0 else 0
    return {
        "session_id": session.id,
        "start_time": session.start_time,
        "end_time": session.end_time,
        "focus_percent": round(focus_percent, 2),
        "logs_count": total
    }

@app.post("/analyze_focus/")
async def analyze_focus(file: UploadFile = File(...)):
    content = await file.read()
    return {"focused": is_focused(content)}