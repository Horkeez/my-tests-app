import secrets
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db
from auth import (
    hash_password, verify_password, generate_code,
    generate_token, code_expiry,
)
from mailer import send_code_email


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



# ==================== АВТОРИЗАЦИЯ ====================

# Шаг 1 регистрации: проверяем данные и шлём код на почту
@app.post("/auth/register/start")
def register_start(data: schemas.RegisterStart, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    login = data.login.strip()

    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль минимум 6 символов")

    # проверяем, не занят ли email или логин подтверждённым пользователем
    existing = db.query(models.User).filter(
        (models.User.email == email) | (models.User.login == login)
    ).first()
    if existing and existing.is_verified:
        if existing.email == email:
            raise HTTPException(status_code=400, detail="Эта почта уже зарегистрирована")
        raise HTTPException(status_code=400, detail="Этот логин уже занят")

    # если был неподтверждённый пользователь — удаляем, создадим заново
    if existing and not existing.is_verified:
        db.delete(existing)
        db.commit()

    # создаём пользователя (пока не подтверждён)
    user = models.User(
        email=email,
        login=login,
        password_hash=hash_password(data.password),
        is_verified=False,
    )
    db.add(user)

    # генерируем код и сохраняем
    code = generate_code()
    db.add(models.EmailCode(
        email=email, code=code, purpose="register", expires_at=code_expiry(),
    ))
    db.commit()

    # отправляем код (или печатаем в консоль)
    send_code_email(email, code, "register")
    return {"sent": True}


# Шаг 2 регистрации: подтверждаем код
@app.post("/auth/register/confirm")
def register_confirm(data: schemas.CodeConfirm, db: Session = Depends(get_db)):
    email = data.email.strip().lower()

    rec = db.query(models.EmailCode).filter(
        models.EmailCode.email == email,
        models.EmailCode.purpose == "register",
    ).order_by(models.EmailCode.id.desc()).first()

    if not rec or rec.code != data.code.strip():
        raise HTTPException(status_code=400, detail="Неверный код")
    if rec.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Код истёк, запросите новый")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Пользователь не найден")

    user.is_verified = True
    db.commit()

    # чистим использованные коды
    db.query(models.EmailCode).filter(
        models.EmailCode.email == email,
        models.EmailCode.purpose == "register",
    ).delete()
    db.commit()

    token = generate_token()
    return {"token": token, "login": user.login, "email": user.email}


# Вход по логину ИЛИ email + пароль
@app.post("/auth/login")
def login(data: schemas.LoginInput, db: Session = Depends(get_db)):
    ident = data.login.strip()
    user = db.query(models.User).filter(
        (models.User.login == ident) | (models.User.email == ident.lower())
    ).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Неверный логин или пароль")
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Почта не подтверждена")

    token = generate_token()
    return {"token": token, "login": user.login, "email": user.email}


# Шаг 1 восстановления: шлём код на почту
@app.post("/auth/reset/start")
def reset_start(data: schemas.ResetStart, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()

    # для безопасности всегда отвечаем "ок", даже если почты нет
    if user and user.is_verified:
        code = generate_code()
        db.add(models.EmailCode(
            email=email, code=code, purpose="reset", expires_at=code_expiry(),
        ))
        db.commit()
        send_code_email(email, code, "reset")
    return {"sent": True}


# Шаг 2 восстановления: подтверждаем код и ставим новый пароль
@app.post("/auth/reset/confirm")
def reset_confirm(data: schemas.ResetConfirm, db: Session = Depends(get_db)):
    email = data.email.strip().lower()

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Пароль минимум 6 символов")

    rec = db.query(models.EmailCode).filter(
        models.EmailCode.email == email,
        models.EmailCode.purpose == "reset",
    ).order_by(models.EmailCode.id.desc()).first()

    if not rec or rec.code != data.code.strip():
        raise HTTPException(status_code=400, detail="Неверный код")
    if rec.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Код истёк, запросите новый")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Пользователь не найден")

    user.password_hash = hash_password(data.new_password)
    db.commit()

    db.query(models.EmailCode).filter(
        models.EmailCode.email == email,
        models.EmailCode.purpose == "reset",
    ).delete()
    db.commit()

    token = generate_token()
    return {"token": token, "login": user.login, "email": user.email}


# Напомнить логин по почте
@app.post("/auth/forgot-login")
def forgot_login(data: schemas.ResetStart, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if user and user.is_verified:
        # отправляем письмо с логином (используем mailer как простое уведомление)
        send_code_email(email, f"Ваш логин: {user.login}", "register")
    return {"sent": True}

