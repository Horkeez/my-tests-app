import smtplib
import os
from email.mime.text import MIMEText

# Данные почты берутся из переменных окружения (безопасно).
# Если их нет — код просто печатается в консоль (режим разработки).
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")


def send_code_email(to_email: str, code: str, purpose: str):
    subject = "Код подтверждения" if purpose == "register" else "Восстановление пароля"
    body = (
        f"Ваш код: {code}\n\n"
        f"Код действует 10 минут.\n"
        f"Если вы не запрашивали его — просто проигнорируйте это письмо."
    )

    # Если почта НЕ настроена — печатаем код в консоль (для разработки)
    if not SMTP_HOST or not SMTP_USER:
        print("=" * 50)
        print(f"[EMAIL -> {to_email}] {subject}")
        print(f"КОД: {code}")
        print("=" * 50)
        return

    # Иначе реально отправляем письмо
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = to_email

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, [to_email], msg.as_string())
    except Exception as e:
        # если отправка не удалась — всё равно покажем код в консоли
        print(f"[ОШИБКА отправки письма: {e}] КОД для {to_email}: {code}")
