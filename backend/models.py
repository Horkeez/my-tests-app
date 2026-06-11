from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    owner = Column(String, index=True)
    title = Column(String)
    type = Column(String)
    questions = Column(JSON)
    share_code = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submissions = relationship(
        "Submission",
        back_populates="test",
        cascade="all, delete-orphan",
    )


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"))
    name = Column(String)
    score = Column(Integer, default=0)
    total = Column(Integer, default=0)
    answered = Column(Integer, default=0)
    skipped = Column(Integer, default=0)
    detailed = Column(JSON)
    at = Column(String)

    test = relationship("Test", back_populates="submissions")
