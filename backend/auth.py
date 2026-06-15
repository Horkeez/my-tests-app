import random
import secrets
from datetime import datetime, timedelta
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def generate_code() -> str:
    # 6-значный код, например "047382"
    return f"{random.randint(0, 999999):06d}"


def generate_token() -> str:
    # токен сессии (простой, для нашего уровня достаточно)
    return secrets.token_hex(24)


def code_expiry() -> datetime:
    # код живёт 10 минут
    return datetime.utcnow() + timedelta(minutes=10)
