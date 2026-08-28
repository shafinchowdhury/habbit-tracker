import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Float, Integer, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class Habit(Base):
    __tablename__ = "habits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True) # Text shown on habit dashboard
    default_duration_minutes = Column(Integer, default=0) # Duration in minutes
    icon = Column(String(50), default="🎯") # Emoji or Lucide icon key
    category = Column(String(50), default="General") # Health, Fitness, Learning, Coding, Productivity, Mindfulness, Reading, Custom
    color = Column(String(50), default="#2563EB") # Accent color
    measurement_type = Column(String(50), default="boolean") # boolean, quantity, duration, distance, count, pages
    target_value = Column(Float, default=1.0)
    unit = Column(String(50), default="times") # hrs, L, steps, pages, times, km
    frequency_type = Column(String(50), default="daily") # daily, weekdays, x_per_week, interval
    frequency_data = Column(JSON, default=dict) # e.g. {"days": [0,1,2,3,4,5,6]} (0=Monday)
    is_paused = Column(Boolean, default=False)
    pause_until = Column(DateTime, nullable=True)
    is_archived = Column(Boolean, default=False)
    visibility = Column(String(50), default="PRIVATE") # PRIVATE, FRIENDS, PUBLIC
    start_date = Column(DateTime, default=utc_now)
    end_date = Column(DateTime, nullable=True)
    target_days = Column(Integer, nullable=True) # e.g. 7, 14, 21, 30, 60, 90, 100 days
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    user = relationship("User", back_populates="habits")
    completions = relationship("HabitCompletion", back_populates="habit", cascade="all, delete-orphan")
    streaks = relationship("Streak", back_populates="habit", cascade="all, delete-orphan")
