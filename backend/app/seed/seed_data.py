import asyncio
from datetime import datetime, date, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserSettings
from app.models.habit import Habit
from app.models.completion import HabitCompletion
from app.models.gamification import Streak, UserLevel, XPTransaction
from app.models.social import Friendship, FriendStreak, Notification, Activity
from app.models.challenge import Challenge, ChallengeParticipant
from app.services.achievement_service import AchievementService
from app.services.streak_service import StreakService
from app.services.xp_service import XPService

async def seed():
    print("🌱 Initializing Database Tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print("🌱 Seeding Achievements...")
        await AchievementService.seed_default_achievements(db)

        print("🌱 Creating Demo Users...")
        # Main Demo User
        demo_user = User(
            email="demo@habitquest.app",
            username="shafin",
            first_name="Shafin",
            hashed_password=get_password_hash("password123"),
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            timezone="America/New_York",
            is_superuser=True,
        )
        db.add(demo_user)
        await db.flush()

        demo_settings = UserSettings(
            user_id=demo_user.id,
            theme="clarity",
            default_week_span="5",
            reduced_motion=False,
            daily_reminder_time="20:00",
            reminder_enabled=True,
        )
        db.add(demo_settings)

        # Friend Users
        friends_data = [
            ("arif@habitquest.app", "arif", "Arif", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", 10, 4200),
            ("nabil@habitquest.app", "nabil", "Nabil", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", 8, 2600),
            ("sakib@habitquest.app", "sakib", "Sakib", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80", 6, 1200),
        ]

        friend_objs = []
        for email, uname, fname, avatar, lvl_val, xp_val in friends_data:
            f_user = User(
                email=email,
                username=uname,
                first_name=fname,
                hashed_password=get_password_hash("password123"),
                avatar_url=avatar,
            )
            db.add(f_user)
            await db.flush()

            f_settings = UserSettings(user_id=f_user.id, theme="midnight")
            db.add(f_settings)

            f_level = UserLevel(user_id=f_user.id, current_level=lvl_val, total_xp=xp_val)
            db.add(f_level)

            f_streak = Streak(user_id=f_user.id, current_streak=12, longest_streak=18, freezes_available=1)
            db.add(f_streak)

            # Friendships
            fs = Friendship(
                requester_id=demo_user.id,
                addressee_id=f_user.id,
                status="ACCEPTED",
            )
            db.add(fs)

            # Friend Streak with Arif & Nabil
            if uname in ("arif", "nabil"):
                f_strk = FriendStreak(
                    user_a_id=demo_user.id,
                    user_b_id=f_user.id,
                    current_streak=14 if uname == "arif" else 9,
                    longest_streak=21,
                )
                db.add(f_strk)

            friend_objs.append(f_user)

        print("🌱 Seeding Habits for Demo User (matching reference image)...")
        habits_config = [
            {
                "name": "Hydration",
                "description": "Drink 2.5L water throughout the day",
                "default_duration_minutes": 0,
                "icon": "💧",
                "category": "Health",
                "color": "#14B8A6",
                "measurement_type": "quantity",
                "target_value": 2.5,
                "unit": "L",
                "frequency_type": "daily",
                "order_index": 1,
            },
            {
                "name": "Coding Practice",
                "description": "DSA & system design",
                "default_duration_minutes": 120,
                "icon": "💻",
                "category": "Coding",
                "color": "#8B5CF6",
                "measurement_type": "duration",
                "target_value": 2.0,
                "unit": "hrs",
                "frequency_type": "daily",
                "order_index": 2,
            },
            {
                "name": "Fullstack Project",
                "description": "Build HabitQuest features",
                "default_duration_minutes": 60,
                "icon": "⚡",
                "category": "Coding",
                "color": "#6366F1",
                "measurement_type": "duration",
                "target_value": 1.0,
                "unit": "hrs",
                "frequency_type": "daily",
                "order_index": 3,
            },
            {
                "name": "10k Steps",
                "description": "Daily outdoor walking",
                "default_duration_minutes": 45,
                "icon": "🏃",
                "category": "Fitness",
                "color": "#22C55E",
                "measurement_type": "count",
                "target_value": 10000,
                "unit": "steps",
                "frequency_type": "daily",
                "order_index": 4,
            },
            {
                "name": "Gym Workout",
                "description": "Hypertrophy resistance training",
                "default_duration_minutes": 60,
                "icon": "🏋️",
                "category": "Fitness",
                "color": "#F59E0B",
                "measurement_type": "duration",
                "target_value": 1.0,
                "unit": "hrs",
                "frequency_type": "weekdays",
                "order_index": 5,
            },
            {
                "name": "Reading Books",
                "description": "Read 20 pages of non-fiction",
                "default_duration_minutes": 30,
                "icon": "📚",
                "category": "Reading",
                "color": "#3B82F6",
                "measurement_type": "pages",
                "target_value": 20,
                "unit": "pages",
                "frequency_type": "daily",
                "order_index": 6,
            },
            {
                "name": "Mindful Meditation",
                "description": "Morning breathing & focus",
                "default_duration_minutes": 15,
                "icon": "🧘",
                "category": "Mindfulness",
                "color": "#EC4899",
                "measurement_type": "duration",
                "target_value": 15,
                "unit": "mins",
                "frequency_type": "daily",
                "order_index": 7,
            },
            {
                "name": "8 Hours Sleep",
                "description": "Optimal physical & mental recovery",
                "default_duration_minutes": 480,
                "icon": "😴",
                "category": "Health",
                "color": "#06B6D4",
                "measurement_type": "duration",
                "target_value": 8.0,
                "unit": "hrs",
                "frequency_type": "daily",
                "order_index": 8,
            },
        ]

        created_habits = []
        for h_data in habits_config:
            h_obj = Habit(
                user_id=demo_user.id,
                start_date=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=40),
                **h_data,
            )
            db.add(h_obj)
            created_habits.append(h_obj)
        await db.flush()

        print("🌱 Seeding 35 Days of Completion History...")
        # Populate 35 days (5 weeks) of history ending today
        today = date.today()
        start_history_d = today - timedelta(days=34)

        total_completions_logged = 0
        total_xp_accumulated = 0

        for i in range(35):
            cur_d = start_history_d + timedelta(days=i)
            cur_str = cur_d.strftime("%Y-%m-%d")

            # Deterministic pattern matching ~91% completion
            for h_idx, habit in enumerate(created_habits):
                is_sched = StreakService.is_habit_scheduled_on_date(habit, cur_d)
                if not is_sched:
                    continue

                # Introduce ~9% missed days in a realistic distribution
                # Days that are missed in reference image
                is_missed = (i == 4 and h_idx == 0) or (i == 11 and h_idx == 5) or (i == 18 and h_idx == 4) or (i == 25 and h_idx == 2)
                
                if not is_missed:
                    # Completed
                    duration_mins = 0.0
                    if habit.measurement_type == "duration":
                        duration_mins = habit.target_value * 60.0
                    elif habit.name == "10k Steps":
                        duration_mins = 45.0
                    elif habit.name == "Gym Workout":
                        duration_mins = 60.0
                    elif habit.name == "Read Tech Book":
                        duration_mins = 25.0
                    else:
                        duration_mins = 15.0

                    comp = HabitCompletion(
                        habit_id=habit.id,
                        user_id=demo_user.id,
                        date=cur_str,
                        status="completed",
                        target_value=habit.target_value,
                        actual_value=habit.target_value,
                        duration_minutes=duration_mins,
                        note="Solid session!" if i % 6 == 0 else None,
                    )
                    db.add(comp)
                    total_completions_logged += 1
                    total_xp_accumulated += 20

        # Create XP transactions and level for demo user
        demo_level = UserLevel(
            user_id=demo_user.id,
            total_xp=2450, # Level 7 / 8
            current_level=7,
        )
        db.add(demo_level)

        demo_streak = Streak(
            user_id=demo_user.id,
            current_streak=14,
            longest_streak=21,
            freezes_available=2,
        )
        db.add(demo_streak)

        # Seed XP transactions
        for i in range(10):
            xp_tx = XPTransaction(
                user_id=demo_user.id,
                amount=20,
                source="habit_completion",
                description="Completed daily habit target",
                created_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=i * 6),
            )
            db.add(xp_tx)

        print("🌱 Seeding Challenges and Leaderboards...")
        challenge = Challenge(
            creator_id=friend_objs[0].id, # Arif
            title="30 Day Coding & Consistency Challenge",
            description="Code every day for at least 1 hour and maintain 90%+ consistency score.",
            category="Coding",
            target_metric="Daily Coding 1hr+",
            duration_days=30,
            visibility="PUBLIC",
            xp_reward=500,
        )
        db.add(challenge)
        await db.flush()

        # Participants
        parts = [
            (demo_user.id, 91.0, 27, False),
            (friend_objs[0].id, 96.0, 29, False), # Arif
            (friend_objs[1].id, 87.0, 26, False), # Nabil
            (friend_objs[2].id, 81.0, 24, False), # Sakib
        ]
        for p_uid, p_pct, p_days, p_comp in parts:
            cp = ChallengeParticipant(
                challenge_id=challenge.id,
                user_id=p_uid,
                completion_percentage=p_pct,
                days_completed=p_days,
                is_completed=p_comp,
            )
            db.add(cp)

        print("🌱 Seeding Activity Feed & Notifications...")
        activities = [
            (friend_objs[0].id, "streak_milestone", "🔥 Arif reached a 14-day streak!"),
            (demo_user.id, "level_up", "⭐ Shafin leveled up to Level 7!"),
            (friend_objs[1].id, "achievement_unlock", "🏆 Nabil unlocked 'Century Club' (100 completions)!"),
            (friend_objs[0].id, "challenge_completed", "⚔️ Arif completed the 30-Day Sprint!"),
        ]
        for u_id, a_type, a_title in activities:
            act = Activity(user_id=u_id, type=a_type, title=a_title, visibility="FRIENDS")
            db.add(act)

        notifications = [
            (demo_user.id, "streak", "🔥 Best Streak Alive!", "You have hit a 14-day streak on Coding!"),
            (demo_user.id, "achievement", "🏆 Achievement Unlocked", "You earned 'On Fire' (+100 XP)"),
            (demo_user.id, "friend", "👥 Friend Streak Synced", "You and Arif both completed habits today!"),
        ]
        for u_id, n_type, n_title, n_msg in notifications:
            noti = Notification(user_id=u_id, type=n_type, title=n_title, message=n_msg, is_read=False)
            db.add(noti)

        await db.commit()
        
        # Trigger achievement check for demo user
        await AchievementService.check_and_unlock_achievements(db, demo_user.id)
        
    print("✅ Seed data populated successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
