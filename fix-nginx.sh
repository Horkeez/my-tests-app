#!/bin/bash
cat > /etc/nginx/sites-available/take-test.ru << 'NGINX'
server {
    listen 80;
    server_name take-test.ru www.take-test.ru _;

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
echo "NGINX OK"
