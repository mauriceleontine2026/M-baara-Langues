from sqlalchemy import Column, Integer, String, Text, DateTime
from ..database import Base
from datetime import datetime


class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(Integer, primary_key=True, index=True)
    language_code = Column(String(50), nullable=False, index=True)
    word = Column(String(255), nullable=False)
    translation_fr = Column(String(255), nullable=True)
    phonetic = Column(String(255), nullable=True)
    contributor_name = Column(String(255), nullable=True)
    region = Column(String(255), nullable=True)
    context_notes = Column(Text, nullable=True)
    audio_url = Column(String(1024), nullable=True)
    status = Column(String(50), default="pending")
    created_by_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
