#!/bin/bash
apt update
apt install -y postgresql
sudo -u postgres createdb testapp
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'testapp2026';"
sed -i "s|export DATABASE_URL=.*|export DATABASE_URL='postgresql://postgres:testapp2026@localhost/testapp'|" /opt/my-tests-app/backend/start.sh
systemctl restart testapp
sleep 3
cd /opt/my-tests-app/backend
venv/bin/python check.py
echo "DONE"
