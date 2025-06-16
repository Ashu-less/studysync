from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class StudySession(Base):
    __tablename__ = "study_sessions"
    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    total_duration = Column(Float, nullable=True)  # in minutes
    average_attention_score = Column(Float, nullable=True)  # 0-100
    recommended_break_duration = Column(Integer, nullable=True)  # in minutes
    focus_logs = relationship("FocusLog", back_populates="session")
    attention_metrics = relationship("AttentionMetric", back_populates="session")

class FocusLog(Base):
    __tablename__ = "focus_logs"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("study_sessions.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    focused = Column(Boolean)
    emotions = Column(JSON)  # Store emotion probabilities
    attention_score = Column(Float)  # 0-100 score
    session = relationship("StudySession", back_populates="focus_logs")

class AttentionMetric(Base):
    __tablename__ = "attention_metrics"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("study_sessions.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    attention_score = Column(Float)  # 0-100
    dominant_emotion = Column(String)
    emotion_confidence = Column(Float)
    focus_duration = Column(Float)  # in minutes
    break_recommended = Column(Boolean)
    session = relationship("StudySession", back_populates="attention_metrics")
