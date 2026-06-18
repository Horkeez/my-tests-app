#!/bin/bash
set -e

echo "============================================"
echo "  ПОЛНАЯ НАСТРОЙКА CLOUDFLARE TUNNEL"
echo "============================================"
echo ""

# 1. Проверяем что бэкенд работает
echo "=== 1. Проверяем бэкенд ==="
systemctl is-active testapp && echo "  testapp: OK" || { echo "  testapp: НЕ РАБОТАЕТ, запускаем..."; systemctl start testapp; sleep 2; }
curl -s http://127.0.0.1:8000/ | grep -q "ok" && echo "  API: OK" || echo "  API: ОШИБКА"
echo ""

# 2. Проверяем PostgreSQL
echo "=== 2. Проверяем PostgreSQL ==="
systemctl is-active postgresql && echo "  PostgreSQL: OK" || { echo "  PostgreSQL: НЕ РАБОТАЕТ"; systemctl start postgresql; }
cd /opt/my-tests-app/backend
venv/bin/python -c "
from database import SessionLocal
from models import User, Test
s = SessionLocal()
print(f'  Пользователи: {s.query(User).count()}')
print(f'  Тесты: {s.query(Test).count()}')
s.close()
" 2>&1 || echo "  ОШИБКА подключения к БД"
echo ""

# 3. Проверяем отправку писем (тест Resend API)
echo "=== 3. Проверяем Resend API ==="
source /opt/my-tests-app/backend/start.sh &>/dev/null || true
if [ -z "$RESEND_API_KEY" ]; then
    # Берём ключ из start.sh напрямую
    RESEND_API_KEY=$(grep RESEND_API_KEY /opt/my-tests-app/backend/start.sh | cut -d"'" -f2)
fi
if [ -n "$RESEND_API_KEY" ]; then
    RESULT=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://api.resend.com/emails \
        -H "Authorization: Bearer $RESEND_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"from":"Конструктор тестов <noreply@take-test.ru>","to":["test@resend.dev"],"subject":"test","text":"test"}')
    if [ "$RESULT" = "200" ] || [ "$RESULT" = "201" ]; then
        echo "  Resend API: OK (код $RESULT)"
    else
        echo "  Resend API: ОШИБКА (код $RESULT)"
    fi
else
    echo "  RESEND_API_KEY не найден!"
fi
echo ""

# 4. Проверяем cloudflared
echo "=== 4. Проверяем cloudflared ==="
which cloudflared && echo "  cloudflared: установлен" || { echo "  cloudflared: НЕ УСТАНОВЛЕН"; exit 1; }
echo ""

# 5. Показываем конфиг cloudflared
echo "=== 5. Конфиг cloudflared ==="
if [ -f /etc/cloudflared/config.yml ]; then
    echo "  Файл: /etc/cloudflared/config.yml"
    cat /etc/cloudflared/config.yml
elif [ -f /root/.cloudflared/config.yml ]; then
    echo "  Файл: /root/.cloudflared/config.yml"
    cat /root/.cloudflared/config.yml
else
    echo "  Конфиг НЕ НАЙДЕН"
    echo "  Проверяем:"
    ls -la /etc/cloudflared/ 2>/dev/null || echo "  /etc/cloudflared/ не существует"
    ls -la /root/.cloudflared/ 2>/dev/null || echo "  /root/.cloudflared/ не существует"
fi
echo ""

# 6. Показываем systemd unit
echo "=== 6. Systemd unit cloudflared ==="
if [ -f /etc/systemd/system/cloudflared.service ]; then
    cat /etc/systemd/system/cloudflared.service
else
    echo "  Сервис НЕ НАЙДЕН"
    systemctl cat cloudflared 2>/dev/null || echo "  systemctl cat: не найден"
fi
echo ""

echo "=== 7. Nginx ==="
systemctl is-active nginx && echo "  nginx: OK" || echo "  nginx: НЕ РАБОТАЕТ"
nginx -t 2>&1
echo ""

echo "============================================"
echo "  ДИАГНОСТИКА ЗАВЕРШЕНА"
echo "  Скопируй весь вывод и пришли мне"
echo "============================================"
