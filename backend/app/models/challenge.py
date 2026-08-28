import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    creator_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="Coding")
    target_metric = Column(String(100), default="Daily Completion")
    duration_days = Column(Integer, default=30)
    start_date = Column(DateTime, default=utc_now)
    end_date = Column(DateTime, nullable=True)
    max_participants = Column(Integer, default=50)
    visibility = Column(String(20), default="PUBLIC") # PUBLIC, FRIENDS, PRIVATE
    xp_reward = Column(Integer, default=500)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    creator = relationship("User", foreign_keys=[creator_id])
    participants = relationship("ChallengeParticipant", back_populates="challenge", cascade="all, delete-orphan")

class ChallengeParticipant(Base):
    __tablename__ = "challenge_participants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    challenge_id = Column(String(36), ForeignKey("challenges.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    joined_at = Column(DateTime, default=utc_now)
    completion_percentage = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    days_completed = Column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint('challenge_id', 'user_id', name='uq_challenge_participant'),
    )

    challenge = relationship("Challenge", back_populates="participants")
    user = relationship("User", foreign_keys=[user_id])
