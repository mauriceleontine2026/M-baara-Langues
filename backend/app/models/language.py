from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from ..database import Base
from datetime import datetime


class Language(Base):
    __tablename__ = "languages"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    name_fr = Column(String(255), nullable=True)
    region = Column(String(255), nullable=True)
    family = Column(String(255), nullable=True)
    status = Column(String(50), default="active")
    color = Column(String(50), nullable=True)
    flag_emoji = Column(String(10), nullable=True)
    total_lessons = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
