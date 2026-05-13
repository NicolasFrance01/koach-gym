import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_9u7zFAqsQaxi@ep-withered-feather-apfc52bv-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)

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
