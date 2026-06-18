#!/bin/bash
cat > /etc/nginx/sites-available/take-test.ru << 'NGINX'
server {
    listen 80 default_server;
    server_name _;

    root /opt/my-tests-app/dist;
    index index.html;

    ssl_ech off;

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
nginx -t 2>&1
if [ $? -ne 0 ]; then
    echo "ssl_ech not supported, using without it"
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
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX
    ln -sf /etc/nginx/sites-available/take-test.ru /etc/nginx/sites-enabled/take-test.ru
fi
systemctl restart nginx
echo "NGINX RESTARTED"
