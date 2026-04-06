#!/usr/bin/env bash
# [GREEN HAT] Brute Login — Demonstração de força bruta em login
#
# Objetivo: Testar se o rate limiter da API bloqueia tentativas consecutivas.
# Alvo: APP_URL ou http://127.0.0.1:5147 (backend .NET)
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:5147}"
ENDPOINT="${APP_URL}/api/feedback"
MAX_ATTEMPTS=10
BLOCKED=0

echo "[GREEN HAT] Brute Login — targeting ${APP_URL}"
echo "Sending ${MAX_ATTEMPTS} rapid requests to test rate limiting..."

for i in $(seq 1 "${MAX_ATTEMPTS}"); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d '{
      "category":"bug",
      "email":"brute@test.local",
      "message":"attempt '"${i}"'",
      "name":"Brute","rating":1,
      "subject":"brute test","wantsReply":false
    }' 2>/dev/null || echo "000")

  if [ "${HTTP_CODE}" = "429" ]; then
    BLOCKED=$((BLOCKED + 1))
    echo "  Request #${i}: 429 Too Many Requests ✓ (blocked)"
  elif [ "${HTTP_CODE}" = "000" ]; then
    echo "  Request #${i}: Connection refused"
  else
    echo "  Request #${i}: ${HTTP_CODE}"
  fi
done

echo ""
if [ "${BLOCKED}" -gt 0 ]; then
  echo "✓ Rate limiter active: ${BLOCKED}/${MAX_ATTEMPTS} requests blocked."
else
  echo "⚠ Rate limiter NOT triggered after ${MAX_ATTEMPTS} attempts!"
fi
