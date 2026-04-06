#!/usr/bin/env bash
# [DEV] Secret Scanner — Varredura de segredos no código-fonte
#
# Objetivo: Detectar credenciais, chaves de API, tokens e senhas
# hardcoded no repositório.
#
# Alvo: raiz do projeto (busca local)
set -euo pipefail

PROJECT_ROOT="${1:-$(pwd)}"
FOUND=0

echo "[DEV] Secret Scanner — scanning ${PROJECT_ROOT}"
echo "================================================"

# Patterns that indicate hardcoded secrets
declare -A PATTERNS
PATTERNS=(
  ["AWS Key"]='AKIA[0-9A-Z]{16}'
  ["Private Key"]='-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----'
  ["Generic Secret"]='(password|secret|token|api_?key)\s*[:=]\s*["\x27][^\s"'\'']{8,}'
  ["MongoDB URI"]='mongodb(\+srv)?://[^:]+:[^@]+@'
  ["Connection String"]='(Server|Data Source)=[^;]+;.*Password=[^;]+'
  ["JWT Token"]='eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}'
  ["GitHub Token"]='gh[ps]_[a-zA-Z0-9]{36}'
  ["Slack Token"]='xox[bpors]-[a-zA-Z0-9-]+'
)

# Files to exclude from scanning
EXCLUDE_DIRS="node_modules|\.git|\.venv|bin|obj|dist|\.tmp|\.angular|playwright-report|test-results"
EXCLUDE_FILES="\.(png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|svg|lock)$"

for label in "${!PATTERNS[@]}"; do
  pattern="${PATTERNS[$label]}"
  matches=$(grep -rPn "${pattern}" "${PROJECT_ROOT}" \
    --include='*.ts' --include='*.js' --include='*.json' \
    --include='*.cs' --include='*.py' --include='*.sh' \
    --include='*.yml' --include='*.yaml' --include='*.env*' \
    --include='*.config' --include='*.xml' \
    2>/dev/null | \
    grep -vE "(${EXCLUDE_DIRS})" | \
    grep -vE "${EXCLUDE_FILES}" | \
    grep -vE '(\.spec\.|\.test\.|mock|fixture|example|sample|roleplay)' || true)

  if [ -n "${matches}" ]; then
    count=$(echo "${matches}" | wc -l)
    FOUND=$((FOUND + count))
    echo ""
    echo "  ⚠ ${label} (${count} match(es)):"
    echo "${matches}" | head -5 | while IFS= read -r line; do
      echo "    ${line}"
    done
    if [ "${count}" -gt 5 ]; then
      echo "    ... and $((count - 5)) more"
    fi
  fi
done

echo ""
echo "================================================"
if [ "${FOUND}" -eq 0 ]; then
  echo "✓ No hardcoded secrets detected."
else
  echo "⚠ ${FOUND} potential secret(s) found! Review before committing."
fi
exit $([ "${FOUND}" -eq 0 ] && echo 0 || echo 1)
