#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# Validates the prompt corpus directory structure and file contents.
#
# Usage:
#   ./tests/scripts/test-prompt-corpus-structure.sh
#   CORPUS_ROOT=.tmp/input-mocks/prompts ./tests/scripts/test-prompt-corpus-structure.sh
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="${CORPUS_ROOT:-.tmp/input-mocks/prompts}"
PASS=0
FAIL=0

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

check_ge() {
  local label="$1" min="$2" actual="$3"
  if (( actual >= min )); then
    echo "  ✓ $label ($actual ≥ $min)"
    ((PASS++)) || true
  else
    echo "  ✗ $label ($actual < $min)"
    ((FAIL++)) || true
  fi
}

echo "═══ Prompt Corpus Structure Tests ═══"
echo "  Root: $ROOT"
echo

# ── Root exists ────────────────────────────────────────────────────────
echo "▸ Corpus root directory"
if [[ -d "$ROOT" ]]; then
  check "Root exists" "true" "true"
else
  echo "  ⊘ Corpus root not found — nothing to test (skipping)"
  exit 0
fi

# ── Language directories ───────────────────────────────────────────────
echo
echo "▸ Language directories"
for LANG in en pt-br es zh; do
  if [[ -d "$ROOT/$LANG" ]]; then
    check "$LANG/ exists" "true" "true"
  else
    check "$LANG/ exists" "true" "false"
  fi
done

# ── Formality directories ─────────────────────────────────────────────
echo
echo "▸ Formality directories"
for LANG in en pt-br es zh; do
  for FORM in formal neutral informal; do
    if [[ -d "$ROOT/$LANG/$FORM" ]]; then
      check "$LANG/$FORM/ exists" "true" "true"
    else
      check "$LANG/$FORM/ exists" "true" "false"
    fi
  done
done

# ── Role directories (spot-check) ─────────────────────────────────────
echo
echo "▸ Role directories (sample)"
SAMPLE_ROLES=(regular lawyer doctor banker accountant hr developer nurse pharmacist)
for ROLE in "${SAMPLE_ROLES[@]}"; do
  if [[ -d "$ROOT/en/formal/$ROLE" ]]; then
    check "en/formal/$ROLE/ exists" "true" "true"
  else
    check "en/formal/$ROLE/ exists" "true" "false"
  fi
done

# ── Length directories ─────────────────────────────────────────────────
echo
echo "▸ Length directories (sample)"
for LEN in short medium long; do
  if [[ -d "$ROOT/en/formal/regular/$LEN" ]]; then
    check "en/formal/regular/$LEN/ exists" "true" "true"
  else
    check "en/formal/regular/$LEN/ exists" "true" "false"
  fi
done

# ── File count ─────────────────────────────────────────────────────────
echo
echo "▸ File counts"
TOTAL=$(find "$ROOT" -name '*.txt' -type f | wc -l)
check_ge "Total .txt files" 1000 "$TOTAL"
echo "  Total: $TOTAL files"

for LANG in en pt-br es zh; do
  if [[ -d "$ROOT/$LANG" ]]; then
    COUNT=$(find "$ROOT/$LANG" -name '*.txt' -type f | wc -l)
    check_ge "$LANG/ file count" 100 "$COUNT"
  fi
done

# ── Non-empty files ────────────────────────────────────────────────────
echo
echo "▸ File content validation (sampling)"
EMPTY=0
CHECKED=0
while IFS= read -r -d '' f; do
  ((CHECKED++)) || true
  if [[ ! -s "$f" ]]; then
    ((EMPTY++)) || true
  fi
done < <(find "$ROOT" -name '*.txt' -type f -print0 | head -z -n 200)

check "No empty files in sample of $CHECKED" "0" "$EMPTY"

# ── PII marker check (files should contain PII-like data) ─────────────
echo
echo "▸ PII content check (sampling)"
PII_FOUND=0
SAMPLE_FILES=$(find "$ROOT" -name '*.txt' -type f | shuf -n 20 2>/dev/null || find "$ROOT" -name '*.txt' -type f | head -20)
for f in $SAMPLE_FILES; do
  if grep -qPi '\d{3}[\.\-]\d{3}[\.\-]\d{3}[\.\-]\d{2}|\d{3}-\d{2}-\d{4}|\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' "$f"; then
    ((PII_FOUND++)) || true
  fi
done
check_ge "Files with PII-like content" 10 "$PII_FOUND"

echo
echo "═══ Results: $PASS passed, $FAIL failed ═══"
[[ $FAIL -eq 0 ]] && exit 0 || exit 1
