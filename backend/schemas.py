from pydantic import BaseModel
from typing import Any, List


class SubmissionCreate(BaseModel):
    name: str
    score: int = 0
    total: int = 0
    answered: int = 0
    skipped: int = 0
    detailed: Any = []
    at: str


class SubmissionOut(SubmissionCreate):
    id: int

    class Config:
        from_attributes = True


class TestCreate(BaseModel):
    owner: str
    title: str
    type: str
    questions: Any


class TestOut(BaseModel):
    id: int
    owner: str
    title: str
    type: str
    questions: Any
    shareCode: str
    submissions: List[SubmissionOut] = []

    class Config:
        from_attributes = True
