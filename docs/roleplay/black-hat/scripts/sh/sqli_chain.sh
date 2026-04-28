#!/usr/bin/env bash
# [BLACK HAT] SQLi Chain — Cadeia de injeção SQL multi-vetor
#
# ⚠ EXCLUSIVO PARA TESTES DEFENSIVOS — NUNCA USE EM PRODUÇÃO.
# Esta pasta é git-ignored (**/black-hat/ no .gitignore).
#
# Objetivo: Testar endpoints da API com payloads SQLi avançados
# incluindo time-based blind, UNION-based, e error-based.
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:5147}"
DETECTED=0
EVADED=0

echo "[BLACK HAT] SQLi Chain — targeting ${APP_URL}"
echo "=============================================="

PAYLOADS=(
  # Error-based
  "' AND 1=CONVERT(int, (SELECT @@version))--"
  "' AND extractvalue(1,concat(0x7e,version()))--"

  # UNION-based
  "' UNION SELECT null,null,null,null,null--"
  "' UNION ALL SELECT table_name,null FROM information_schema.tables--"

  # Time-based blind
  "'; WAITFOR DELAY '0:0:5'--"
  "' AND SLEEP(5)--"
  "1' AND (SELECT * FROM (SELECT(SLEEP(3)))a)--"

  # Stacked queries
  "'; INSERT INTO feedback(message) VALUES('pwned');--"
  "'; UPDATE users SET role='admin' WHERE '1'='1';--"

  # Comment variations
  "admin'/*"
  "admin'#"
  "1' OR '1'='1'/**/--"
)

test_sqli() {
  local payload="$1"
  local start end elapsed

  start=$(date +%s%N 2>/dev/null || date +%s)

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${APP_URL}/api/feedback" \
    -H "Content-Type: application/json" \
    -d "{
      \"category\":\"bug\",
      \"email\":\"sqli@test.local\",
      \"message\":$(printf '%s' "${payload}" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'),
      \"name\":\"SQLi\",\"rating\":1,
      \"subject\":\"sqli test\",\"wantsReply\":false
    }" 2>/dev/null || echo "000")

  end=$(date +%s%N 2>/dev/null || date +%s)

  # Check for time-based blind (response > 4 seconds)
  if [[ "${start}" =~ ^[0-9]{10,}$ ]]; then
    elapsed=$(( (end - start) / 1000000 ))  # ns to ms
  else
    elapsed=$(( (end - start) * 1000 ))
  fi

  if [ "${HTTP_CODE}" = "500" ]; then
    EVADED=$((EVADED + 1))
    echo "  ⚠ CRASH [500] Time: ${elapsed}ms — ${payload:0:50}"
  elif [ "${elapsed}" -gt 4000 ] 2>/dev/null; then
    EVADED=$((EVADED + 1))
    echo "  ⚠ TIME-BASED [${HTTP_CODE}] ${elapsed}ms — ${payload:0:50}"
  else
    DETECTED=$((DETECTED + 1))
    echo "  ✓ BLOCKED [${HTTP_CODE}] ${elapsed}ms — ${payload:0:50}"
  fi
}

for payload in "${PAYLOADS[@]}"; do
  test_sqli "${payload}"
done

echo ""
TOTAL=$((DETECTED + EVADED))
echo "=== Resultado ==="
echo "Blocked: ${DETECTED}/${TOTAL}  Evaded: ${EVADED}"
if [ "${EVADED}" -eq 0 ]; then
  echo "✓ Todas as injeções SQL foram bloqueadas."
else
  echo "⚠ ${EVADED} payload(s) podem ter passado pela proteção!"
fi
