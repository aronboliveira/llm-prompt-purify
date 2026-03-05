#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# Smoke test for the LLM Prompt Purify backend API.
#
# Usage:
#   ./tests/scripts/smoke-test-api.sh                     # localhost:5185
#   BASE_URL=http://localhost:48080 ./tests/scripts/smoke-test-api.sh
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE="${BASE_URL:-http://localhost:5185}"
PASS=0
FAIL=0

check() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  ✓ $label"
    ((PASS++))
  else
    echo "  ✗ $label  (expected $expected, got $actual)"
    ((FAIL++))
  fi
}

echo "═══ Smoke Testing API at $BASE ═══"
echo

# ── Health ─────────────────────────────────────────────────────────────
echo "▸ GET /api/health"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
check "Status 200" "200" "$STATUS"

BODY=$(curl -s "$BASE/api/health")
check "Contains 'ok'" "ok" "$(echo "$BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin)["status"])')"

echo

# ── Feedback: valid submission ─────────────────────────────────────────
echo "▸ POST /api/feedback (valid general-feedback)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/feedback" \
  -H "Content-Type: application/json" \
  -d '{"category":"general-feedback","message":"Smoke test from curl."}')
check "Status 201" "201" "$STATUS"

echo

# ── Feedback: appraisal without rating → 400 ──────────────────────────
echo "▸ POST /api/feedback (appraisal, missing rating)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/feedback" \
  -H "Content-Type: application/json" \
  -d '{"category":"appraisal","message":"Missing the rating."}')
check "Status 400" "400" "$STATUS"

echo

# ── Feedback: empty body → 400 ────────────────────────────────────────
echo "▸ POST /api/feedback (empty body)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/feedback" \
  -H "Content-Type: application/json" \
  -d '{}')
check "Status 400" "400" "$STATUS"

echo

# ── Mask-safety: valid CPF → 200 ──────────────────────────────────────
echo "▸ POST /api/mask-safety/validate (valid CPF)"
RESP=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE/api/mask-safety/validate" \
  -H "Content-Type: application/json" \
  -d '{"candidates":[{"ruleId":"cpf","candidateValue":"529.982.247-25"}]}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Status 200" "200" "$STATUS"

IS_COMP=$(echo "$BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin)["results"][0]["isCompromising"])')
check "CPF is compromising" "True" "$IS_COMP"

echo

# ── Mask-safety: Luhn credit card → 200 ───────────────────────────────
echo "▸ POST /api/mask-safety/validate (Visa test card)"
RESP=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE/api/mask-safety/validate" \
  -H "Content-Type: application/json" \
  -d '{"candidates":[{"ruleId":"credit-card","candidateValue":"4111111111111111"}]}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Status 200" "200" "$STATUS"

IS_COMP=$(echo "$BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin)["results"][0]["isCompromising"])')
check "Card is compromising" "True" "$IS_COMP"

echo

# ── Mask-safety: batch > 128 → 400 ────────────────────────────────────
echo "▸ POST /api/mask-safety/validate (batch > 128)"
BIG=$(python3 -c '
import json
cs = [{"ruleId":"cpf","candidateValue":"529.982.247-25"}] * 129
print(json.dumps({"candidates": cs}))
')
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/mask-safety/validate" \
  -H "Content-Type: application/json" \
  -d "$BIG")
check "Status 400" "400" "$STATUS"

echo

# ── Mask-safety: unsupported rule ──────────────────────────────────────
echo "▸ POST /api/mask-safety/validate (unknown rule)"
RESP=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE/api/mask-safety/validate" \
  -H "Content-Type: application/json" \
  -d '{"candidates":[{"ruleId":"fake-rule","candidateValue":"12345"}]}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "Status 200" "200" "$STATUS"

DECISION=$(echo "$BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin)["results"][0]["decision"])')
check "Decision unsupported" "unsupported" "$DECISION"

echo
echo "═══ Results: $PASS passed, $FAIL failed ═══"
[[ $FAIL -eq 0 ]] && exit 0 || exit 1
