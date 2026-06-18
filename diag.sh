#!/bin/bash
echo "=== 1. iptables ==="
iptables -L -n --line-numbers
echo ""
echo "=== 2. Services ==="
systemctl is-active nginx
systemctl is-active testapp
echo ""
echo "=== 3. Ports ==="
ss -tlnp | grep -E ':80|:443|:8000|:22'
echo ""
echo "=== 4. Curl localhost ==="
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost
echo ""
echo ""
echo "=== 5. Curl by IP ==="
curl -s -o /dev/null -w "HTTP %{http_code}" http://89.169.44.165
echo ""
echo ""
echo "=== 6. DNS ==="
dig +short take-test.ru A 2>/dev/null || nslookup take-test.ru 2>/dev/null | grep Address
echo ""
echo "=== 7. Nginx config test ==="
nginx -t 2>&1
echo ""
echo "=== 8. Cloudflared status ==="
systemctl is-active cloudflared 2>/dev/null || echo "not found"
systemctl is-enabled cloudflared 2>/dev/null || echo "not found"
echo ""
echo "=== 9. Timeweb firewall (nftables) ==="
nft list ruleset 2>/dev/null | head -30 || echo "nft not available"
echo ""
echo "=== DIAG DONE ==="
