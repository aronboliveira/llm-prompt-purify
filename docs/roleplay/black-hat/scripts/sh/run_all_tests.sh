#!/usr/bin/env bash
# [BLACK HAT] Orquestrador de Testes — Red Team / Offensive
#
# ⚠ PARA TESTES DEFENSIVOS APENAS — git-ignored via **/black-hat/
#
# Executa em sequência:
#   1. Playwright e2e tests (browser-based evasion, obfuscation, false positives)
#   2. Shell — SQLi chain (injeção SQL avançada contra API)
#   3. Python — Advanced SQLi (multi-technique probing)
#
# Este orquestrador NÃO executa Jest diretamente pois os scripts
# black-hat são git-ignored e não possuem testes unitários no repositório.
#
# Uso: bash docs/roleplay/black-hat/scripts/sh/run_all_tests.sh
# Variáveis de ambiente opcionais:
#   APP_URL       — URL do backend (padrão: http://127.0.0.1:5147)
#   SKIP_E2E      — Pular testes Playwright (padrão: false)
#   SKIP_SHELL    — Pular scripts de shell (padrão: false)
#   SKIP_PYTHON   — Pular scripts Python (padrão: false)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"
ROLE="BLACK HAT"
PASSED=0
FAILED=0

echo "=========================================="
echo "⚠ [${ROLE}] Orquestrador de Testes — DEFENSIVE ONLY"
echo "   $(date -Iseconds)"
echo "=========================================="
echo ""

# ── 1. Playwright E2E Tests ─────────────────────────────────────────
if [ "${SKIP_E2E:-false}" != "true" ]; then
  echo "── [1/3] Playwright E2E Tests ──"
  if (cd "${PROJECT_ROOT}" && npx playwright test tests/e2e/roleplay/black-hat.spec.ts 2>&1); then
    PASSED=$((PASSED + 1))
    echo "  ✓ Playwright: PASSED"
  else
    FAILED=$((FAILED + 1))
    echo "  ✗ Playwright: FAILED"
  fi
  echo ""
else
  echo "── [1/3] Playwright E2E Tests — SKIPPED ──"
  echo ""
fi

# ── 2. Shell — SQLi Chain ──────────────────────────────────────────
if [ "${SKIP_SHELL:-false}" != "true" ]; then
  echo "── [2/3] Shell — SQLi Chain ──"
  SQLI_CHAIN="${SCRIPT_DIR}/sqli_chain.sh"
  if [ -f "${SQLI_CHAIN}" ]; then
    if bash "${SQLI_CHAIN}" 2>&1; then
      PASSED=$((PASSED + 1))
      echo "  ✓ SQLi Chain: PASSED"
    else
      FAILED=$((FAILED + 1))
      echo "  ✗ SQLi Chain: FAILED"
    fi
  else
    echo "  ⚠ sqli_chain.sh não encontrado em ${SQLI_CHAIN}"
  fi
  echo ""
else
  echo "── [2/3] Shell — SQLi Chain — SKIPPED ──"
  echo ""
fi

# ── 3. Python — Advanced SQLi ──────────────────────────────────────
if [ "${SKIP_PYTHON:-false}" != "true" ]; then
  echo "── [3/3] Python — Advanced SQLi ──"
  ADVANCED_SQLI="${SCRIPT_DIR}/../py/advanced_sqli.py"
  if [ -f "${ADVANCED_SQLI}" ]; then
    if python3 "${ADVANCED_SQLI}" 2>&1; then
      PASSED=$((PASSED + 1))
      echo "  ✓ Advanced SQLi: PASSED"
    else
      FAILED=$((FAILED + 1))
      echo "  ✗ Advanced SQLi: FAILED"
    fi
  else
    echo "  ⚠ advanced_sqli.py não encontrado em ${ADVANCED_SQLI}"
  fi
  echo ""
else
  echo "── [3/3] Python — Advanced SQLi — SKIPPED ──"
  echo ""
fi

# ── Resumo ──────────────────────────────────────────────────────────
echo "=========================================="
echo "[${ROLE}] Resumo: ${PASSED} passaram, ${FAILED} falharam"
echo "=========================================="

if [ "${FAILED}" -gt 0 ]; then
  exit 1
fi
