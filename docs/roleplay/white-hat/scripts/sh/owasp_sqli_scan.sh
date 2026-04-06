#!/usr/bin/env bash
# [WHITE HAT] OWASP SQLi Scan — SQL injection probes against API endpoints
#
# Objetivo: Testar endpoints da API com payloads OWASP de injeção SQL
# para verificar se a validação de entrada é adequada.
#
# Alvo: APP_URL ou http://127.0.0.1:5147 (backend .NET)
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:5147}"
PASSED=0
FAILED=0
TOTAL=0

echo "[WHITE HAT] OWASP SQLi Scan — targeting ${APP_URL}"

# SQLi payloads from OWASP Testing Guide
PAYLOADS=(
  "' OR '1'='1"
  "1; DROP TABLE feedback;--"
  "' UNION SELECT null,null,null--"
  "admin'--"
  "1' AND 1=1--"
  "'; EXEC xp_cmdshell('whoami');--"
  "1 OR 1=1"
  "' OR ''='"
)

test_endpoint() {
  local endpoint="$1"
  local field="$2"
  local payload="$3"

  TOTAL=$((TOTAL + 1))
  # Inject the payload into the feedback message field
  local body
  body=$(cat <<EOF
{
  "category": "bug",
  "email": "sqli@test.local",
  "message": $(printf '%s' "${payload}" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'),
  "name": "SQLi Test",
  "rating": 1,
  "subject": "${payload}",
  "wantsReply": false
}
EOF
  )

  local response
  response=$(curl -s -w "\n%{http_code}" \
    -X POST "${endpoint}" \
    -H "Content-Type: application/json" \
    -d "${body}" 2>/dev/null || echo -e "\n000")

  local http_code
  http_code=$(echo "${response}" | tail -1)
  local body_response
  body_response=$(echo "${response}" | sed '$d')

  # Check for SQL error signatures in the response
  if echo "${body_response}" | grep -qiE "sql|syntax|mysql|sqlite|postgres|oracle|exception.*query|stack trace"; then
    FAILED=$((FAILED + 1))
    echo "  ⚠ VULN [${http_code}] ${field}: ${payload:0:40}..."
    echo "    Response hints at SQL error disclosure"
  elif [ "${http_code}" = "500" ]; then
    FAILED=$((FAILED + 1))
    echo "  ⚠ SUSPICIOUS [500] ${field}: ${payload:0:40}..."
  else
    PASSED=$((PASSED + 1))
    echo "  ✓ SAFE [${http_code}] ${field}: ${payload:0:40}..."
  fi
}

echo ""
echo "=== Testing /api/feedback ==="
for payload in "${PAYLOADS[@]}"; do
  test_endpoint "${APP_URL}/api/feedback" "message" "${payload}"
done

echo ""
echo "=== Testing /api/mask-safety/validate ==="
for payload in "${PAYLOADS[@]}"; do
  TOTAL=$((TOTAL + 1))
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${APP_URL}/api/mask-safety/validate" \
    -H "Content-Type: application/json" \
    -d "{\"candidates\":[{\"candidateValue\":\"${payload}\",\"ruleId\":\"ssn\"}]}" 2>/dev/null || echo "000")

  if [ "${HTTP_CODE}" = "500" ]; then
    FAILED=$((FAILED + 1))
    echo "  ⚠ SUSPICIOUS [500] candidateValue: ${payload:0:40}..."
  else
    PASSED=$((PASSED + 1))
    echo "  ✓ SAFE [${HTTP_CODE}] candidateValue: ${payload:0:40}..."
  fi
done

echo ""
echo "=== Summary ==="
echo "Total: ${TOTAL}  Passed: ${PASSED}  Failed: ${FAILED}"
[ "${FAILED}" -eq 0 ] && echo "✓ No SQL injection vulnerabilities detected." || echo "⚠ ${FAILED} potential SQLi issue(s) found!"
