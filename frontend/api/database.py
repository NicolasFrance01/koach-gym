import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Koach Gym — Neon.tech PostgreSQL
_FALLBACK_DB = "postgresql://neondb_owner:npg_XhDVG8E7Uaok@ep-frosty-recipe-ahotz8kq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DATABASE_URL = os.getenv("DATABASE_URL", _FALLBACK_DB)


try:
    engine = create_engine(DATABASE_URL)
    # Fast test
    with engine.connect() as conn:
        pass
    print("Database connection successful.")
except Exception as e:
    print(f"CRITICAL ERROR: Failed to connect to database: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
