import secrets
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tests API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _to_out(test: models.Test) -> dict:
    return {
        "id": test.id,
        "owner": test.owner,
        "title": test.title,
        "type": test.type,
        "questions": test.questions,
        "shareCode": test.share_code,
        "submissions": [
            {
                "id": s.id,
                "name": s.name,
                "score": s.score,
                "total": s.total,
                "answered": s.answered,
                "skipped": s.skipped,
                "detailed": s.detailed,
                "at": s.at,
            }
            for s in test.submissions
        ],
    }


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/tests")
def get_tests(owner: str, db: Session = Depends(get_db)):
    tests = db.query(models.Test).filter(models.Test.owner == owner).all()
    return [_to_out(t) for t in tests]


@app.get("/tests/by-code/{code}")
def get_test_by_code(code: str, db: Session = Depends(get_db)):
    test = db.query(models.Test).filter(models.Test.share_code == code).first()
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    return _to_out(test)


@app.post("/tests")
def create_test(data: schemas.TestCreate, db: Session = Depends(get_db)):
    code = secrets.token_hex(3).upper()
    test = models.Test(
        owner=data.owner,
        title=data.title,
        type=data.type,
        questions=data.questions,
        share_code=code,
    )
    db.add(test)
    db.commit()
    db.refresh(test)
    return _to_out(test)


@app.delete("/tests/{test_id}")
def delete_test(test_id: int, db: Session = Depends(get_db)):
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    db.delete(test)
    db.commit()
    return {"deleted": True}


@app.put("/tests/{test_id}")
def update_test(test_id: int, data: schemas.TestCreate, db: Session = Depends(get_db)):
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")

    test.title = data.title
    test.type = data.type
    test.questions = data.questions
    db.commit()
    db.refresh(test)
    return _to_out(test)


@app.post("/tests/{test_id}/submissions")
def add_submission(
    test_id: int,
    data: schemas.SubmissionCreate,
    db: Session = Depends(get_db),
):
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")

    sub = models.Submission(
        test_id=test_id,
        name=data.name,
        score=data.score,
        total=data.total,
        answered=data.answered,
        skipped=data.skipped,
        detailed=data.detailed,
        at=data.at,
    )
    db.add(sub)
    db.commit()
    db.refresh(test)
    return _to_out(test)

@app.delete("/tests/{test_id}/submissions/{sub_id}")
def delete_submission(test_id: int, sub_id: int, db: Session = Depends(get_db)):
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")

    sub = (
        db.query(models.Submission)
        .filter(models.Submission.id == sub_id, models.Submission.test_id == test_id)
        .first()
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Прохождение не найдено")

    db.delete(sub)
    db.commit()
    db.refresh(test)
    return _to_out(test)
