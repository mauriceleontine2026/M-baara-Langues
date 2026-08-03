from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from ..database import Base
from datetime import datetime




class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    title_fr = Column(String(255), nullable=True)
    language_code = Column(String(20), default="fr")
    lesson_number = Column(Integer, default=1)
    difficulty = Column(String(50), default="beginner")
    level = Column(String(50), nullable=True)
    type = Column(String(50), nullable=True)
    order = Column(Integer, default=1)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
