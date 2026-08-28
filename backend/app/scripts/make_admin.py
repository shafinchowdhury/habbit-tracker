import sys
import asyncio
from sqlalchemy import select, or_, update
from app.core.database import AsyncSessionLocal
from app.models.user import User

async def promote_user(identifier: str):
    async with AsyncSessionLocal() as session:
        stmt = select(User).where(
            or_(User.username == identifier, User.email == identifier)
        )
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()
        
        if not user:
            print(f"❌ Error: User '{identifier}' not found in the database.")
            return False
            
        user.is_superuser = True
        await session.commit()
        print(f"👑 SUCCESS: User '{user.username}' ({user.email}) is now an Official Superuser Admin!")
        return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m app.scripts.make_admin <username_or_email>")
        sys.exit(1)
    
    target = sys.argv[1].strip()
    asyncio.run(promote_user(target))
