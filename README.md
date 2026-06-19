# Конструктор тестов

Веб-приложение для создания тестов, опросов и аналитики с системой регистрации, email-подтверждением и шаринга по QR-коду.

**Demo:** [take-test.ru](https://take-test.ru)

## Возможности

### Типы тестов
- **Тест с баллами** — автоматическая проверка, подсчёт результатов
- **Опрос / сбор данных** — сбор ответов без оценки
- **Аналитика** — статистика по ответам

### Типы вопросов
- Один правильный ответ
- Несколько правильных ответов
- Текстовый ответ
- Сопоставление (с поддержкой картинок)
- Расположить в правильном порядке
- Загрузка изображений к вопросам и вариантам

### Функции
- Папки для организации тестов
- Перемешивание вопросов
- Таймер с автоматической отправкой
- Обязательные вопросы
- Дублирование тестов
- QR-код и ссылка для прохождения
- Шаринг через мессенджеры
- Экспорт результатов в CSV
- Подробная статистика и аналитика ответов
- Тёмная тема
- PWA — установка как приложение на телефон

### Авторизация
- Регистрация с подтверждением по email (6-значный код)
- Вход по логину или email
- Восстановление пароля
- Напоминание логина по email
- JWT-токены (72 часа)

## Технологии

### Frontend
| Технология | Назначение |
|------------|------------|
| React 19 | UI-фреймворк |
| Tailwind CSS 4 | Стилизация |
| Vite 8 | Сборка и dev-сервер |
| Lucide React | Иконки |
| qrcode.react | Генерация QR-кодов |
| vite-plugin-pwa | PWA / Service Worker |

### Backend
| Технология | Назначение |
|------------|------------|
| Python / FastAPI | REST API |
| SQLAlchemy | ORM |
| PostgreSQL | База данных |
| Pydantic | Валидация данных |
| PyJWT | Авторизация (JWT) |
| Passlib + bcrypt | Хеширование паролей |
| Resend API | Отправка email |

### Инфраструктура
| Компонент | Технология |
|-----------|------------|
| Сервер | Ubuntu (VPS) |
| Веб-сервер | Nginx |
| ASGI-сервер | Uvicorn |
| SSL | Let's Encrypt |
| Процесс-менеджер | systemd |

## API

### Тесты
```
GET    /tests?owner={login}        — список тестов пользователя
GET    /tests/by-code/{code}       — тест по коду (публичный)
POST   /tests                      — создать тест
PUT    /tests/{id}                 — обновить тест
DELETE /tests/{id}                 — удалить тест
```

### Результаты
```
POST   /tests/{id}/submissions     — отправить прохождение
DELETE /tests/{id}/submissions/{id} — удалить результат
```

### Авторизация
```
POST   /auth/register/start       — отправить код на email
POST   /auth/register/confirm     — подтвердить код
POST   /auth/login                — войти
POST   /auth/reset/start          — код для сброса пароля
POST   /auth/reset/confirm        — новый пароль
POST   /auth/forgot-login         — напомнить логин
```

## Установка и запуск

### Frontend
```bash
npm install
npm run dev       # Разработка (localhost:5173)
npm run build     # Продакшен-сборка
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Переменные окружения (backend)
```
DATABASE_URL=postgresql://user:password@localhost/dbname
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=noreply@your-domain.com
JWT_SECRET=your-secret-key
```

## Структура проекта

```
├── src/
│   ├── App.jsx          # Основной компонент (UI, логика)
│   └── api.js           # API-клиент
├── backend/
│   ├── main.py          # FastAPI endpoints
│   ├── models.py        # SQLAlchemy модели
│   ├── schemas.py       # Pydantic схемы + валидация
│   ├── database.py      # Подключение к БД
│   ├── auth.py          # JWT, хеширование, коды
│   └── mailer.py        # Отправка email через Resend
├── public/              # Статические файлы, иконки
├── vite.config.js       # Конфигурация Vite + PWA
└── package.json
```

## Лицензия

MIT
