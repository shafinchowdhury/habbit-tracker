import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Text, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class HabitCompletion(Base):
    __tablename__ = "habit_completions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    habit_id = Column(String(36), ForeignKey("habits.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    date = Column(String(10), index=True, nullable=False) # Format: YYYY-MM-DD
    status = Column(String(50), default="completed") # completed, partial, skipped, rest_day
    target_value = Column(Float, default=1.0)
    actual_value = Column(Float, default=1.0)
    duration_minutes = Column(Float, default=0.0) # Used for time invested aggregation
    note = Column(Text, nullable=True)
    completed_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        UniqueConstraint('habit_id', 'date', name='uq_habit_date'),
        Index('idx_user_date', 'user_id', 'date'),
    )

    habit = relationship("Habit", back_populates="completions")
    user = relationship("User", back_populates="completions")
