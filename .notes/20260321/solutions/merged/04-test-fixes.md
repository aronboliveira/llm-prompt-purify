# Test Infrastructure Fixes

All changes target `tests/e2e/mock-corpus-browselite.spec.ts`.  
**No engine code is modified — these fixes only improve test accuracy.**

## Fix 1: Add word-boundary + substring de-duplication to `extractSensitiveValues`

**Function location**: lines 317–365  
**Resolves**: 2,186 CUIT-substring inflation

The root cause of the largest test artifact is that `29530492-2` (inner
portion of CUIT `20-29530492-2`) matches the RUT regex and gets reported
as a separate leak. De-duplicating by removing values that are substrings
of longer values eliminates this inflated count.

Current return:

```typescript
return Array.from(new Set(values));
```

Fixed return:

```typescript
const unique = Array.from(new Set(values));
return unique.filter((v, _, arr) => !arr.some(other => other !== v && other.length > v.length && other.includes(v)));
```

---

## Fix 2: Add RUT checksum validation

**Resolves**: 472 false positives (pt-br|br RG numbers, other scopes)

Add a test-local checksum function and attach it to the RUT pattern:

```typescript
function isTestValidRut(value: string): boolean {
  const normalized = value.replace(/[.\-]/g, "").toUpperCase();
  if (!/^\d{7,8}[0-9K]$/u.test(normalized)) return false;
  const body = normalized.slice(0, -1);
  const verifier = normalized.slice(-1);
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  const expected = remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);
  return verifier === expected;
}
```

In the patterns array, change:

```diff
- { re: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk]\b/g },
+ { re: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk]\b/g, validator: isTestValidRut },
```

And extend the extraction loop to call validators:

```diff
  for (const { re, luhn, validator } of patterns) {
    for (const match of sourceText.matchAll(re)) {
      if (luhn && !luhnValid(match[0])) continue;
+     if (validator && !validator(match[0])) continue;
      values.push(match[0]);
    }
  }
```

---

## Fix 3: Bearer token minimum length

**Resolves**: 4 false positives ("Bearer token" literal text)

Real OAuth bearer tokens are 20+ characters. The word "token" is 5 chars.

```diff
- { re: /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gu },
+ { re: /\bBearer\s+[A-Za-z0-9\-._~+/]{20,}=*/gu },
```

---

## Fix 4: Add IBAN checksum validation

**Resolves**: 574 false positives (mock IBANs with invalid mod-97 checksums)

The engine's `isLikelyIban` validator uses mod-97 verification. The test
extractor catches all structural IBAN matches without checksum validation,
inflating the report with mock IBANs like `GB89BANK95431514479519`.

Add a test-local IBAN validator:

```typescript
function isTestValidIban(value: string): boolean {
  const v = value.toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(v)) return false;
  const rearranged = v.slice(4) + v.slice(0, 4);
  let numeric = "";
  for (const ch of rearranged) {
    numeric += /[A-Z]/.test(ch) ? (ch.charCodeAt(0) - 55).toString() : ch;
  }
  let rem = 0;
  for (const d of numeric) rem = (rem * 10 + Number(d)) % 97;
  return rem === 1;
}
```

Apply to the IBAN pattern:

```diff
- { re: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g },
+ { re: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g, validator: isTestValidIban },
```

---

## Fix 5: Fix `categorizeLeak` ordering and anchoring

**Function location**: line 407  
**Resolves**: Report miscategorization (CN IDs→CPFs, CURPs→IBANs, RFCs→CreditCards)

The current function uses unanchored `.test()` calls in an order that
causes cascade mismatches. Fix by:

1. Adding `^...$` anchors where possible
2. Reordering to check more specific patterns first (longest match wins)
3. Adding missing categories

```typescript
function categorizeLeak(leak: string): string {
  const v = leak.replace(/^leak:\s*/, "");

  // Exact-format checks (anchored, most specific first)
  if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/iu.test(v)) return "Email Addresses";
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v)) return "JWT Tokens";
  if (/^(?:AKIA|ASIA)[A-Z0-9]{16}$/.test(v)) return "AWS Access Keys";
  if (/^AC[a-f0-9]{32}$/i.test(v)) return "Twilio SIDs";
  if (/^gh[pousr]_[A-Za-z0-9]{20,}$/.test(v)) return "GitHub PATs";
  if (/^Bearer\s/.test(v)) return "Bearer Tokens";
  if (/^sk[-_]/.test(v)) return "API Keys (OpenAI/Stripe)";

  // Chinese IDs BEFORE CPF (18 digits would match CPF's 11-digit subsequence)
  if (/^\d{17}[\dXx]$/.test(v)) return "Chinese Resident IDs";

  // Structured identifiers (anchored)
  if (/^\d{3}-\d{2}-\d{4}$/.test(v)) return "US SSNs";
  if (/^\d{2}-\d{8}-\d$/.test(v)) return "Argentine CUITs";
  if (/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(v)) return "Brazilian CNPJs";
  if (/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(v)) return "Brazilian CPFs";
  if (/^\d{11}$/.test(v)) return "Brazilian CPFs (unformatted)";
  if (/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(v)) return "Mexican CURPs";
  if (/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i.test(v)) return "Mexican RFCs";
  if (/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(v)) return "IBANs";
  if (/^\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk]$/.test(v)) return "Chilean RUTs";

  return "Credit Cards / Other Financial";
}
```

Key changes:

- Chinese IDs checked before CPF (prevents 470 miscategorizations)
- All patterns anchored with `^...$` (prevents substring mismatches)
- CURPs and RFCs checked before IBAN (prevents 22+22 miscategorizations)
- Added `Brazilian CPFs (unformatted)` category for 11-digit values

---

## Fix 6 (Optional): Add IBAN checksum to mock corpus generator

**File**: `utils/scripts/generate_massive_corpus.py`

If mock IBANs should be valid, update the generator to compute mod-97
checksums. Otherwise, accept that the test IBAN validator (Fix 4) will
correctly filter them.

---

## Impact Summary

| Fix                         | False Reports Eliminated | Test Logic Changed |
| --------------------------- | -----------------------: | ------------------ |
| 1. Substring de-duplication |                   ~2,186 | Return filter      |
| 2. RUT checksum             |                     ~472 | New validator      |
| 3. Bearer min-length        |                        4 | Regex change       |
| 4. IBAN checksum            |                     ~574 | New validator      |
| 5. categorizeLeak anchoring |                     ~514 | Rewrite            |
| **Total**                   |               **~3,236** | —                  |

After these fixes, the test report will accurately reflect only real
engine gaps and cross-scope issues.
