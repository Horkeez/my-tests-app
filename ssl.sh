#!/bin/bash
certbot --nginx -d take-test.ru -d www.take-test.ru --non-interactive --agree-tos -m noreply@take-test.ru
echo "SSL DONE"
