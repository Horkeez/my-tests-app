#!/bin/bash
cat > /etc/nginx/sites-available/take-test.ru << 'NGINX'
server {
    listen 80;
    server_name take-test.ru www.take-test.ru _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name take-test.ru www.take-test.ru;

    ssl_certificate /etc/letsencrypt/live/take-test.ru-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/take-test.ru-0001/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

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
nginx -t && systemctl restart nginx
echo "HTTPS CONFIGURED"
echo "Test: https://take-test.ru"
