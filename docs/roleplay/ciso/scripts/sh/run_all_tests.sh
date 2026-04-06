#!/usr/bin/env bash
# [CISO] Orquestrador de Testes — Compliance & Governança
#
# Executa em sequência:
#   1. Jest unit tests (CSP compliance, grading)
#   2. Playwright e2e tests (OWASP/PCI-DSS/LGPD browser-based audit)
#   3. Shell — Security header scan (cabeçalhos HTTP)
#   4. Python — GDPR/LGPD PII scanner (detecção de padrões)
#
# Uso: bash docs/roleplay/ciso/scripts/sh/run_all_tests.sh
# Variáveis de ambiente opcionais:
#   APP_URL       — URL do backend (padrão: http://127.0.0.1:5147)
#   SKIP_JEST     — Pular testes Jest (padrão: false)
#   SKIP_E2E      — Pular testes Playwright (padrão: false)
#   SKIP_SHELL    — Pular scripts de shell (padrão: false)
#   SKIP_PYTHON   — Pular scripts Python (padrão: false)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"
ROLE="CISO"
PASSED=0
FAILED=0

echo "=========================================="
echo "[${ROLE}] Orquestrador de Testes — $(date -Iseconds)"
echo "=========================================="
echo ""

# ── 1. Jest Unit Tests ──────────────────────────────────────────────
if [ "${SKIP_JEST:-false}" != "true" ]; then
  echo "── [1/4] Jest Unit Tests ──"
  if (cd "${PROJECT_ROOT}" && npx jest tests/jest/roleplay/ciso.spec.ts --no-coverage 2>&1); then
    PASSED=$((PASSED + 1))
    echo "  ✓ Jest: PASSED"
  else
    FAILED=$((FAILED + 1))
    echo "  ✗ Jest: FAILED"
  fi
  echo ""
else
  echo "── [1/4] Jest Unit Tests — SKIPPED ──"
  echo ""
fi

# ── 2. Playwright E2E Tests ─────────────────────────────────────────
if [ "${SKIP_E2E:-false}" != "true" ]; then
  echo "── [2/4] Playwright E2E Tests ──"
  if (cd "${PROJECT_ROOT}" && npx playwright test tests/e2e/roleplay/ciso.spec.ts 2>&1); then
    PASSED=$((PASSED + 1))
    echo "  ✓ Playwright: PASSED"
  else
    FAILED=$((FAILED + 1))
    echo "  ✗ Playwright: FAILED"
  fi
  echo ""
else
  echo "── [2/4] Playwright E2E Tests — SKIPPED ──"
  echo ""
fi

# ── 3. Shell — Security Header Scan ────────────────────────────────
if [ "${SKIP_SHELL:-false}" != "true" ]; then
  echo "── [3/4] Shell — Security Header Scan ──"
  HEADER_SCAN="${SCRIPT_DIR}/security_header_scan.sh"
  if [ -f "${HEADER_SCAN}" ]; then
    if bash "${HEADER_SCAN}" 2>&1; then
      PASSED=$((PASSED + 1))
      echo "  ✓ Security Header Scan: PASSED"
    else
      FAILED=$((FAILED + 1))
      echo "  ✗ Security Header Scan: FAILED"
    fi
  else
    echo "  ⚠ security_header_scan.sh não encontrado em ${HEADER_SCAN}"
  fi
  echo ""
else
  echo "── [3/4] Shell — Security Header Scan — SKIPPED ──"
  echo ""
fi

# ── 4. Python — GDPR/LGPD PII Scanner ──────────────────────────────
if [ "${SKIP_PYTHON:-false}" != "true" ]; then
  echo "── [4/4] Python — GDPR/LGPD PII Scanner ──"
  GDPR_SCANNER="${SCRIPT_DIR}/../py/gdpr_scanner.py"
  if [ -f "${GDPR_SCANNER}" ]; then
    if python3 "${GDPR_SCANNER}" 2>&1; then
      PASSED=$((PASSED + 1))
      echo "  ✓ GDPR Scanner: PASSED"
    else
      FAILED=$((FAILED + 1))
      echo "  ✗ GDPR Scanner: FAILED"
    fi
  else
    echo "  ⚠ gdpr_scanner.py não encontrado em ${GDPR_SCANNER}"
  fi
  echo ""
else
  echo "── [4/4] Python — GDPR/LGPD PII Scanner — SKIPPED ──"
  echo ""
fi

# ── Resumo ──────────────────────────────────────────────────────────
echo "=========================================="
echo "[${ROLE}] Resumo: ${PASSED} passaram, ${FAILED} falharam"
echo "=========================================="

if [ "${FAILED}" -gt 0 ]; then
  exit 1
fi
