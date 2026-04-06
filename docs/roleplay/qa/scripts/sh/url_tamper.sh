#!/usr/bin/env bash
# [QA] URL Tamper — Testes de adulteração de URL e path traversal
#
# Objetivo: Testar se a API resiste a manipulação de URL,
# path traversal, e parâmetros maliciosos.
#
# Alvo: APP_URL ou http://127.0.0.1:5147 (backend .NET)
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:5147}"
PASSED=0
FAILED=0

echo "[QA] URL Tamper — targeting ${APP_URL}"
echo "======================================="

test_url() {
  local description="$1"
  local url="$2"
  local expected_safe="$3"  # "yes" if safe means 404/400/405, "no" if 200/201 is OK

  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "${url}" 2>/dev/null || echo "000")

  if [ "${expected_safe}" = "yes" ]; then
    # Safe means endpoint properly rejects the request
    if [[ "${http_code}" =~ ^(400|401|403|404|405|429)$ ]]; then
      PASSED=$((PASSED + 1))
      echo "  ✓ [${http_code}] ${description}"
    elif [ "${http_code}" = "500" ]; then
      FAILED=$((FAILED + 1))
      echo "  ⚠ [500] ${description} — server crash"
    elif [ "${http_code}" = "000" ]; then
      echo "  - [---] ${description} — connection refused"
    else
      FAILED=$((FAILED + 1))
      echo "  ⚠ [${http_code}] ${description} — unexpected response"
    fi
  else
    # Expected to succeed
    if [[ "${http_code}" =~ ^(200|201)$ ]]; then
      PASSED=$((PASSED + 1))
      echo "  ✓ [${http_code}] ${description}"
    else
      FAILED=$((FAILED + 1))
      echo "  ⚠ [${http_code}] ${description}"
    fi
  fi
}

echo ""
echo "--- Path Traversal ---"
test_url "Direct path traversal" "${APP_URL}/../../etc/passwd" "yes"
test_url "Encoded path traversal" "${APP_URL}/%2e%2e/%2e%2e/etc/passwd" "yes"
test_url "Double-encoded traversal" "${APP_URL}/%252e%252e/%252e%252e/etc/passwd" "yes"
test_url "Null byte injection" "${APP_URL}/api/health%00.html" "yes"

echo ""
echo "--- Route Manipulation ---"
test_url "Valid health endpoint" "${APP_URL}/api/health" "no"
test_url "Case manipulation" "${APP_URL}/API/HEALTH" "yes"
test_url "Extra slashes" "${APP_URL}///api///health" "yes"
test_url "Trailing dot" "${APP_URL}/api/health." "yes"
test_url "Semicolon injection" "${APP_URL}/api/health;id=1" "yes"

echo ""
echo "--- Query Parameter Injection ---"
test_url "Basic query param" "${APP_URL}/api/health?debug=true" "no"
test_url "Admin escalation" "${APP_URL}/api/health?admin=true&role=superuser" "no"
test_url "Prototype pollution" "${APP_URL}/api/health?__proto__[admin]=true" "no"

echo ""
echo "--- Hidden Endpoints ---"
test_url "Swagger in non-dev" "${APP_URL}/swagger/v1/swagger.json" "yes"
test_url "Environment endpoint" "${APP_URL}/api/env" "yes"
test_url "Debug endpoint" "${APP_URL}/api/debug" "yes"
test_url "Admin endpoint" "${APP_URL}/api/admin" "yes"
test_url "Config endpoint" "${APP_URL}/api/config" "yes"

echo ""
echo "=== Summary ==="
TOTAL=$((PASSED + FAILED))
echo "Passed: ${PASSED}/${TOTAL}  Failed: ${FAILED}"
[ "${FAILED}" -eq 0 ] && echo "✓ All URL tampering tests passed." || echo "⚠ ${FAILED} issue(s) found!"
