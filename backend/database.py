import os
import re
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./tests.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if ".neon.tech" in DATABASE_URL and "options=" not in DATABASE_URL:
    match = re.search(r"@(ep-[^.]+?)(?:-pooler)?\.", DATABASE_URL)
    if match:
        endpoint_id = match.group(1)
        sep = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL += f"{sep}options=endpoint%3D{endpoint_id}"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

if DATABASE_URL.startswith("postgresql"):
    connect_args["connect_timeout"] = 10

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
