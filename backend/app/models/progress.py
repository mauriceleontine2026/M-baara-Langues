from sqlalchemy import Column, Integer, String, DateTime, JSON
from ..database import Base
from datetime import datetime




class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    language_code = Column(String(20), default="fr")
    xp = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    completed_lessons = Column(JSON, default=list)
    next_goal = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)
