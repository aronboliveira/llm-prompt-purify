#!/usr/bin/env bash
# [DEV] Orquestrador de Testes — Backend Developer
#
# Executa em sequência:
#   1. Jest unit tests (rate limiting, API design assertions)
#   2. Playwright e2e tests (secret detection, header audit, validation)
#   3. Shell — secret scanner (repo-wide credential scan)
#
# Uso: bash docs/roleplay/dev/scripts/sh/run_all_tests.sh
# Variáveis de ambiente opcionais:
#   APP_URL       — URL do backend (padrão: http://127.0.0.1:5147)
#   SKIP_JEST     — Pular testes Jest (padrão: false)
#   SKIP_E2E      — Pular testes Playwright (padrão: false)
#   SKIP_SHELL    — Pular scripts de shell (padrão: false)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"
ROLE="DEV"
PASSED=0
FAILED=0

echo "=========================================="
echo "[${ROLE}] Orquestrador de Testes — $(date -Iseconds)"
echo "=========================================="
echo ""

# ── 1. Jest Unit Tests ──────────────────────────────────────────────
if [ "${SKIP_JEST:-false}" != "true" ]; then
  echo "── [1/3] Jest Unit Tests ──"
  if (cd "${PROJECT_ROOT}" && npx jest tests/jest/roleplay/dev.spec.ts --no-coverage 2>&1); then
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
  if (cd "${PROJECT_ROOT}" && npx playwright test tests/e2e/roleplay/dev.spec.ts 2>&1); then
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

# ── 3. Shell — Secret Scanner ──────────────────────────────────────
if [ "${SKIP_SHELL:-false}" != "true" ]; then
  echo "── [3/3] Shell — Secret Scanner ──"
  SECRET_SCANNER="${SCRIPT_DIR}/secret_scanner.sh"
  if [ -f "${SECRET_SCANNER}" ]; then
    if bash "${SECRET_SCANNER}" 2>&1; then
      PASSED=$((PASSED + 1))
      echo "  ✓ Secret Scanner: PASSED"
    else
      FAILED=$((FAILED + 1))
      echo "  ✗ Secret Scanner: FAILED (secrets encontrados)"
    fi
  else
    echo "  ⚠ secret_scanner.sh não encontrado em ${SECRET_SCANNER}"
  fi
  echo ""
else
  echo "── [3/3] Shell — Secret Scanner — SKIPPED ──"
  echo ""
fi

# ── Resumo ──────────────────────────────────────────────────────────
echo "=========================================="
echo "[${ROLE}] Resumo: ${PASSED} passaram, ${FAILED} falharam"
echo "=========================================="

if [ "${FAILED}" -gt 0 ]; then
  exit 1
fi
