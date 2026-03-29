#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# Validates prompt corpus content by running the Python detection engine
# on a sample of prompt files.
#
# Usage:
#   ./tests/scripts/test-prompt-corpus-detection.sh
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="${CORPUS_ROOT:-.tmp/input-mocks/prompts}"
PASS=0
FAIL=0
SKIP=0

check() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  ✓ $label"
    ((PASS++)) || true
  else
    echo "  ✗ $label  (expected $expected, got $actual)"
    ((FAIL++)) || true
  fi
}

echo "═══ Prompt Corpus Detection Tests ═══"
echo "  Root: $ROOT"
echo

if [[ ! -d "$ROOT" ]]; then
  echo "  ✗ Corpus root not found — skipping all tests"
  exit 1
fi

# ── Run Python detection on sample files per language ──────────────────
for LANG in en pt-br es zh; do
  echo "▸ Detection: $LANG"

  SAMPLE_FILES=$(find "$ROOT/$LANG" -name '*.txt' -type f | shuf -n 10 2>/dev/null || find "$ROOT/$LANG" -name '*.txt' -type f | head -10)
  DETECTED=0
  TESTED=0

  for f in $SAMPLE_FILES; do
    ((TESTED++)) || true
    RESULT=$(python3 -c "
import sys, os
sys.path.insert(0, os.getcwd())
from tests.python.detection import detect_sensitive_data
with open('$f', 'r') as fh:
    text = fh.read()
detections = detect_sensitive_data(text)
print(len(detections))
" 2>/dev/null || echo "0")

    if (( RESULT > 0 )); then
      ((DETECTED++)) || true
    fi
  done

  if (( TESTED == 0 )); then
    echo "  ⊘ No files for $LANG — skipped"
    ((SKIP++)) || true
  elif (( DETECTED * 2 >= TESTED )); then
    echo "  ✓ $LANG: $DETECTED/$TESTED files had detections"
    ((PASS++)) || true
  else
    echo "  ✗ $LANG: only $DETECTED/$TESTED files had detections"
    ((FAIL++)) || true
  fi

  echo
done

# ── Per-role detection spot check ──────────────────────────────────────
echo "▸ Role-specific detection (en/formal)"
ROLES=(regular lawyer doctor banker accountant hr developer nurse pharmacist)
for ROLE in "${ROLES[@]}"; do
  DIR="$ROOT/en/formal/$ROLE/medium"
  if [[ ! -d "$DIR" ]]; then
    continue
  fi

  FILE=$(find "$DIR" -name '*.txt' -type f | head -1)
  if [[ -z "$FILE" ]]; then
    continue
  fi

  RESULT=$(python3 -c "
import sys, os
sys.path.insert(0, os.getcwd())
from tests.python.detection import detect_sensitive_data
with open('$FILE', 'r') as fh:
    text = fh.read()
detections = detect_sensitive_data(text)
print(len(detections))
" 2>/dev/null || echo "0")

  if (( RESULT > 0 )); then
    check "$ROLE has PII detected" "true" "true"
  else
    check "$ROLE has PII detected" "true" "false"
  fi
done

echo
echo "═══ Results: $PASS passed, $FAIL failed, $SKIP skipped ═══"
[[ $FAIL -eq 0 ]] && exit 0 || exit 1
