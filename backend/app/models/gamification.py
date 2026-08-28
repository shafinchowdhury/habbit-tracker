import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, Text, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class Streak(Base):
    __tablename__ = "streaks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    habit_id = Column(String(36), ForeignKey("habits.id", ondelete="CASCADE"), nullable=True, index=True) # Nullable = overall user streak
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_completed_date = Column(String(10), nullable=True) # YYYY-MM-DD
    freezes_available = Column(Integer, default=2)
    freezes_used = Column(Integer, default=0)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="streaks")
    habit = relationship("Habit", back_populates="streaks")

class XPTransaction(Base):
    __tablename__ = "xp_transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    amount = Column(Integer, nullable=False)
    source = Column(String(50), nullable=False) # habit_completion, challenge_reward, streak_milestone, achievement
    reference_id = Column(String(36), nullable=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="xp_transactions")

class UserLevel(Base):
    __tablename__ = "user_levels"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_xp = Column(Integer, default=0)
    current_level = Column(Integer, default=1)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="level")

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    icon = Column(String(50), default="🏆")
    xp_reward = Column(Integer, default=50)
    category = Column(String(50), default="consistency") # consistency, streaks, volume, social, challenges
    tier = Column(String(20), default="bronze") # bronze, silver, gold, diamond
    target_value = Column(Integer, default=1)
    created_at = Column(DateTime, default=utc_now)

    user_achievements = relationship("UserAchievement", back_populates="achievement", cascade="all, delete-orphan")

class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    achievement_id = Column(String(36), ForeignKey("achievements.id", ondelete="CASCADE"), index=True, nullable=False)
    progress_value = Column(Integer, default=0)
    unlocked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        UniqueConstraint('user_id', 'achievement_id', name='uq_user_achievement'),
    )

    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")

class StreakFreeze(Base):
    __tablename__ = "streak_freezes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    used_date = Column(String(10), nullable=False) # YYYY-MM-DD
    habit_id = Column(String(36), ForeignKey("habits.id", ondelete="CASCADE"), nullable=True)
    reason = Column(String(255), default="Automated streak preservation")
    created_at = Column(DateTime, default=utc_now)
