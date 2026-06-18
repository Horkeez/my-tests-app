#!/bin/bash
cd /opt/my-tests-app
git pull
npm install
npm run build
systemctl restart testapp
systemctl restart cloudflared
sleep 3
curl -s http://127.0.0.1:8000/ && echo ""
echo "DONE"
