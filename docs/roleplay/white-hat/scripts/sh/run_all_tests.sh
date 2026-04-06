#!/usr/bin/env bash
# [WHITE HAT] Orquestrador de Testes — Ethical Hacking Avançado
#
# Executa em sequência:
#   1. Jest unit tests (XSS probe, CSP audit)
#   2. Playwright e2e tests (browser-based XSS, header inspection)
#   3. Shell — OWASP SQLi scan (API-level injection probes)
#
# Uso: bash docs/roleplay/white-hat/scripts/sh/run_all_tests.sh
# Variáveis de ambiente opcionais:
#   APP_URL       — URL do backend (padrão: http://127.0.0.1:5147)
#   SKIP_JEST     — Pular testes Jest (padrão: false)
#   SKIP_E2E      — Pular testes Playwright (padrão: false)
#   SKIP_SHELL    — Pular scripts de shell (padrão: false)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"
ROLE="WHITE HAT"
PASSED=0
FAILED=0

echo "=========================================="
echo "[${ROLE}] Orquestrador de Testes — $(date -Iseconds)"
echo "=========================================="
echo ""

# ── 1. Jest Unit Tests ──────────────────────────────────────────────
if [ "${SKIP_JEST:-false}" != "true" ]; then
  echo "── [1/3] Jest Unit Tests ──"
  if (cd "${PROJECT_ROOT}" && npx jest tests/jest/roleplay/white-hat.spec.ts --no-coverage 2>&1); then
    PASSED=$((PASSED + 1))
    echo "  ✓ Jest: PASSED"
  else
    FAILED=$((FAILED + 1))
    echo "  ✗ Jest: FAILED"
  fi
  echo ""
else
  echo "── [1/3] Jest Unit Tests — SKIPPED ──"
  echo ""
fi

# ── 2. Playwright E2E Tests ─────────────────────────────────────────
if [ "${SKIP_E2E:-false}" != "true" ]; then
  echo "── [2/3] Playwright E2E Tests ──"
  if (cd "${PROJECT_ROOT}" && npx playwright test tests/e2e/roleplay/white-hat.spec.ts 2>&1); then
    PASSED=$((PASSED + 1))
    echo "  ✓ Playwright: PASSED"
  else
    FAILED=$((FAILED + 1))
    echo "  ✗ Playwright: FAILED"
  fi
  echo ""
else
  echo "── [2/3] Playwright E2E Tests — SKIPPED ──"
  echo ""
fi

# ── 3. Shell — OWASP SQLi Scan ─────────────────────────────────────
if [ "${SKIP_SHELL:-false}" != "true" ]; then
  echo "── [3/3] Shell — OWASP SQLi Scan ──"
  SQLI_SCAN="${SCRIPT_DIR}/owasp_sqli_scan.sh"
  if [ -f "${SQLI_SCAN}" ]; then
    if bash "${SQLI_SCAN}" 2>&1; then
      PASSED=$((PASSED + 1))
      echo "  ✓ OWASP SQLi Scan: PASSED"
    else
      FAILED=$((FAILED + 1))
      echo "  ✗ OWASP SQLi Scan: FAILED"
    fi
  else
    echo "  ⚠ owasp_sqli_scan.sh não encontrado em ${SQLI_SCAN}"
  fi
  echo ""
else
  echo "── [3/3] Shell — OWASP SQLi Scan — SKIPPED ──"
  echo ""
fi

# ── Resumo ──────────────────────────────────────────────────────────
echo "=========================================="
echo "[${ROLE}] Resumo: ${PASSED} passaram, ${FAILED} falharam"
echo "=========================================="

if [ "${FAILED}" -gt 0 ]; then
  exit 1
fi
