import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Почта Gmail и пароль приложения берутся из переменных окружения.
# Локально их задаём через "set", на Render — во вкладке Environment.
EMAIL_ADDRESS = os.environ.get("EMAIL_ADDRESS", "")
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD", "")


def send_code_email(to_email: str, code_or_text: str, purpose: str):
    """
    purpose:
      'register' — код подтверждения регистрации
      'reset'    — код для смены пароля
    Если в code_or_text передан готовый текст (например, "Ваш логин: ..."),
    он отправляется как есть.
    """

    # Формируем тему и тело письма
    if code_or_text.lower().startswith("ваш логин"):
        subject = "Ваш логин"
        body = code_or_text
    elif purpose == "reset":
        subject = "Код для смены пароля"
        body = (
            f"Ваш код для смены пароля: {code_or_text}\n\n"
            f"Код действует ограниченное время.\n"
            f"Если вы не запрашивали смену пароля — просто проигнорируйте письмо."
        )
    else:  # register
        subject = "Код подтверждения регистрации"
        body = (
            f"Ваш код подтверждения: {code_or_text}\n\n"
            f"Введите его в приложении, чтобы завершить регистрацию.\n"
            f"Код действует ограниченное время."
        )

    # Если почта не настроена — печатаем код в лог (как раньше)
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        print("=" * 50)
        print(f"[EMAIL -> {to_email}] {subject}")
        print(body)
        print("=" * 50)
        return

    # Отправляем письмо через Gmail
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)
        print(f"[EMAIL OK] Письмо отправлено на {to_email}")
    except Exception as e:
        # Если отправка не удалась — печатаем код в лог, чтобы не потерять
        print(f"[EMAIL ERROR] {e}")
        print(f"[EMAIL -> {to_email}] {subject}\n{body}")
