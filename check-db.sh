#!/bin/bash
echo "=== 1. PostgreSQL статус ==="
systemctl is-active postgresql

echo ""
echo "=== 2. Таблицы в БД ==="
sudo -u postgres psql testapp -c "\dt"

echo ""
echo "=== 3. Структура таблицы tests ==="
sudo -u postgres psql testapp -c "\d tests"

echo ""
echo "=== 4. Данные в БД ==="
sudo -u postgres psql testapp -c "SELECT COUNT(*) as users FROM users;"
sudo -u postgres psql testapp -c "SELECT COUNT(*) as tests FROM tests;"
sudo -u postgres psql testapp -c "SELECT COUNT(*) as submissions FROM submissions;"
sudo -u postgres psql testapp -c "SELECT id, owner, title, folder, created_at FROM tests ORDER BY id;"
sudo -u postgres psql testapp -c "SELECT id, login, email, is_verified FROM users;"

echo ""
echo "=== 5. DATABASE_URL в start.sh ==="
grep DATABASE_URL /opt/my-tests-app/backend/start.sh

echo ""
echo "=== 6. Последние ошибки бэкенда ==="
journalctl -u testapp --since "1 hour ago" --no-pager | grep -i "error\|ERROR\|exception\|traceback" | tail -20

echo ""
echo "=== 7. Сервисы ==="
echo -n "testapp: "; systemctl is-active testapp
echo -n "nginx: "; systemctl is-active nginx
echo -n "cloudflared: "; systemctl is-active cloudflared
echo -n "postgresql: "; systemctl is-active postgresql

echo ""
echo "=== ДИАГНОСТИКА ЗАВЕРШЕНА ==="
