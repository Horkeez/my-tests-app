#!/bin/bash
echo "============================================"
echo "  ВКЛЮЧЕНИЕ CLOUDFLARE TUNNEL"
echo "============================================"

# 1. Nginx — убираем HTTPS-редирект, оставляем порт 80 для tunnel
echo "=== 1. Настраиваем Nginx (порт 80 для tunnel) ==="
cat > /etc/nginx/sites-available/take-test.ru << 'NGINX'
server {
    listen 80 default_server;
    server_name _;

    root /opt/my-tests-app/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/take-test.ru /etc/nginx/sites-enabled/take-test.ru
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
echo "  Nginx: OK"
echo ""

# 2. Включаем cloudflared
echo "=== 2. Включаем cloudflared ==="
systemctl enable cloudflared
systemctl restart cloudflared
sleep 3
systemctl is-active cloudflared && echo "  Cloudflared: OK" || echo "  Cloudflared: ОШИБКА"
echo ""

# 3. Проверяем все сервисы
echo "=== 3. Итоговая проверка ==="
echo -n "  PostgreSQL: "; systemctl is-active postgresql
echo -n "  testapp:    "; systemctl is-active testapp
echo -n "  nginx:      "; systemctl is-active nginx
echo -n "  cloudflared:"; systemctl is-active cloudflared
echo ""

# 4. Проверяем API
echo "=== 4. Тест API ==="
curl -s http://127.0.0.1:8000/ && echo ""
curl -s http://localhost/api/ && echo ""
echo ""

# 5. Проверяем БД
echo "=== 5. Тест БД ==="
cd /opt/my-tests-app/backend
venv/bin/python -c "
from database import SessionLocal
from models import User, Test
s = SessionLocal()
print(f'  Users: {s.query(User).count()}, Tests: {s.query(Test).count()}')
s.close()
"
echo ""

echo "============================================"
echo "  ГОТОВО! Теперь настрой DNS (см. инструкцию)"
echo "============================================"
