#!/usr/bin/env bash
# [CISO] Security Header Scan — Varredura completa de cabeçalhos de segurança
#
# Objetivo: Verificar a presença e configuração correta de todos os
# cabeçalhos de segurança recomendados para conformidade corporativa.
#
# Alvo: APP_URL ou http://127.0.0.1:5147 (backend .NET)
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:5147}"
ENDPOINT="${APP_URL}/api/health"
PASSED=0
FAILED=0
WARNINGS=0

echo "[CISO] Security Header Scan — targeting ${APP_URL}"
echo "================================================="

HEADERS=$(curl -sI "${ENDPOINT}" 2>/dev/null || echo "")

if [ -z "${HEADERS}" ]; then
  echo "✗ Could not connect to ${ENDPOINT}"
  exit 1
fi

check_header() {
  local name="$1"
  local expected="${2:-}"
  local severity="${3:-FAIL}"

  local value
  value=$(echo "${HEADERS}" | grep -i "^${name}:" | head -1 | sed 's/^[^:]*: *//' | tr -d '\r')

  if [ -z "${value}" ]; then
    if [ "${severity}" = "WARN" ]; then
      WARNINGS=$((WARNINGS + 1))
      echo "  ⚠ MISSING  ${name} (recommended)"
    else
      FAILED=$((FAILED + 1))
      echo "  ✗ MISSING  ${name} (REQUIRED)"
    fi
    return
  fi

  if [ -n "${expected}" ]; then
    if echo "${value}" | grep -qi "${expected}"; then
      PASSED=$((PASSED + 1))
      echo "  ✓ PRESENT  ${name}: ${value}"
    else
      FAILED=$((FAILED + 1))
      echo "  ⚠ MISCFG   ${name}: ${value} (expected: ${expected})"
    fi
  else
    PASSED=$((PASSED + 1))
    echo "  ✓ PRESENT  ${name}: ${value}"
  fi
}

check_absent() {
  local name="$1"
  local value
  value=$(echo "${HEADERS}" | grep -i "^${name}:" | head -1 | sed 's/^[^:]*: *//' | tr -d '\r')

  if [ -n "${value}" ]; then
    WARNINGS=$((WARNINGS + 1))
    echo "  ⚠ EXPOSED  ${name}: ${value} (should be removed)"
  else
    PASSED=$((PASSED + 1))
    echo "  ✓ HIDDEN   ${name} (not disclosed)"
  fi
}

echo ""
echo "--- Required Security Headers ---"
check_header "Strict-Transport-Security" "max-age="
check_header "X-Content-Type-Options" "nosniff"
check_header "X-Frame-Options" "DENY"
check_header "Content-Security-Policy" "default-src"
check_header "Referrer-Policy" "strict-origin"

echo ""
echo "--- Recommended Headers ---"
check_header "Permissions-Policy" "" "WARN"
check_header "Cache-Control" "no-store" "WARN"
check_header "X-XSS-Protection" "1" "WARN"

echo ""
echo "--- Information Disclosure ---"
check_absent "Server"
check_absent "X-Powered-By"
check_absent "X-AspNet-Version"
check_absent "X-AspNetMvc-Version"

echo ""
echo "=== Summary ==="
TOTAL=$((PASSED + FAILED + WARNINGS))
echo "Passed: ${PASSED}/${TOTAL}  Failed: ${FAILED}  Warnings: ${WARNINGS}"

if [ "${FAILED}" -eq 0 ] && [ "${WARNINGS}" -eq 0 ]; then
  echo "Grade: A — Full compliance"
elif [ "${FAILED}" -eq 0 ]; then
  echo "Grade: B — Minor improvements needed"
elif [ "${FAILED}" -le 2 ]; then
  echo "Grade: C — Moderate security gaps"
else
  echo "Grade: D — Significant security gaps"
fi
