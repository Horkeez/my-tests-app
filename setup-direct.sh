#!/bin/bash
set -e

echo "=== 1. Stop Cloudflare Tunnel ==="
systemctl stop cloudflared || true
systemctl disable cloudflared || true

echo "=== 2. Open ports 80, 443, 22 ==="
iptables -F
iptables -P INPUT ACCEPT
iptables -P FORWARD ACCEPT
iptables -P OUTPUT ACCEPT
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

echo "=== 3. Install certbot ==="
apt install -y certbot python3-certbot-nginx

echo "=== 4. Configure Nginx for HTTP ==="
cat > /etc/nginx/sites-available/take-test.ru << 'NGINX'
server {
    listen 80;
    server_name take-test.ru www.take-test.ru;

    root /opt/my-tests-app/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/take-test.ru /etc/nginx/sites-enabled/take-test.ru
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo "=== 5. Get SSL certificate ==="
certbot --nginx -d take-test.ru -d www.take-test.ru --non-interactive --agree-tos -m noreply@take-test.ru

echo "=== 6. Install fail2ban ==="
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

echo "=== 7. Restart backend ==="
systemctl restart testapp

echo "=== DONE ==="
echo "Site: https://take-test.ru"
