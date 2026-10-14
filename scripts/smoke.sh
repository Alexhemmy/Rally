#!/usr/bin/env bash
set -euo pipefail
API="${API_URL:-http://localhost:4000}"
echo "Health..."
curl -sf "$API/health" | head -c 200
echo
echo "Register..."
HANDLE="smoke_$(date +%s)"
REG=$(curl -sf -X POST "$API/api/auth/register" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$HANDLE@test.local\",\"password\":\"password123\",\"handle\":\"$HANDLE\",\"displayName\":\"Smoke\"}")
TOKEN=$(echo "$REG" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
test -n "$TOKEN"
echo "Token packs..."
curl -sf "$API/api/tokens/packs" | head -c 120
echo
echo "Rankings..."
curl -sf "$API/api/rankings" | head -c 120
echo
echo "Smoke OK"
