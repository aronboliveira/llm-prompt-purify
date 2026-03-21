# Implementation Roadmap

Three-phase plan. Phases are sequential — each builds on the prior.

---

## Phase 0 — Test Accuracy (no engine changes)

**Goal**: Eliminate test artifacts so the leak report reflects reality.  
**Effort**: ~1 day  
**Files modified**:

- `tests/e2e/mock-corpus-browselite.spec.ts`

### Steps

1. Add `isTestValidRut` function (see 04-test-fixes.md §Fix 2)
2. Add `isTestValidIban` function (see 04-test-fixes.md §Fix 4)
3. Extend extraction loop to call validators
4. Add substring de-duplication to `extractSensitiveValues` return
5. Tighten Bearer regex to 20+ char minimum
6. Rewrite `categorizeLeak` with anchored patterns and correct ordering
7. Run full browselite test — expect ~4,700 fewer reported leaks
8. Snapshot new baseline numbers

### Validation

```bash
npx playwright test mock-corpus-browselite --reporter=json > report.json
python3 -c "
import json, sys
d = json.load(open('report.json'))
# Verify new counts match expectations
"
```

### Expected Outcome

| Metric                           | Before | After Phase 0 |
| -------------------------------- | -----: | ------------: |
| Total leak values                |  7,352 |        ~4,116 |
| False positives (test artifacts) |  3,236 |             0 |
| Real leaks                       |  4,116 |         4,116 |

---

## Phase 1 — Engine Fixes (masking rule changes)

**Goal**: Close the 470 genuine engine gaps.  
**Effort**: ~2 days (implement + unit tests)  
**Files modified**:

- `src/app/core/masking/constants/masking-rules.constants.ts`
- `src/app/core/masking/utils/mask-validation.utils.ts` (export `isValidUsaSsn`)
- `src/app/core/masking/masking.engine.spec.ts` (new unit tests)

### Steps

1. **Standalone Chinese Resident ID rule** (see 03-engine-fixes.md §Fix 2)
   - Add `cn-resident-id` rule with `coverage: "global"`
   - Use existing `isValidChineseResidentId` validator
   - Regex: `/\b\d{17}[\dXx]\b/gu`
   - Run unit tests: `npm test -- --testPathPattern=masking`

2. **Global labeled-format variants** (see 03-engine-fixes.md §Fix 4)
   - Audit all `coverage: "country"` rules that use `"labeled"` or `"json"` patterns
   - Promote SSN labeled variant (`ssn-labeled`, line 845) to `coverage: "global"`
   - Add global labeled equivalents for CN-ID if not already global

3. Run unit tests:

   ```bash
   npm test -- --testPathPattern=masking
   ```

4. Run full browselite test — expect ~470 fewer leaks

### Validation

After Phase 1 the standalone Chinese ID gap closes:

| Metric      | After Phase 0 | After Phase 1 |
| ----------- | ------------: | ------------: |
| Real leaks  |        ~4,116 |        ~3,646 |
| Engine gaps |           470 |             0 |

---

## Phase 2 — Scope Intelligence (architecture change)

**Goal**: Reduce cross-scope misses from 3,408 to near zero.  
**Effort**: ~3-5 days (design + implement + regression)  
**Files modified**:

- `src/app/core/masking/utils/country-scope.utils.ts`
- `src/app/core/masking/masking.engine.ts`
- `src/app/core/masking/types/` (if scope types change)
- `src/app/features/` (UI for region selection)

### Steps

1. **Add `expandCountryScope` function** (see 03-engine-fixes.md §Fix 3)
   - Maps `"latam-es"` → `["mx", "ar", "cl", "co", "pe"]`
   - Maps `"eu"` → `["de", "fr", "es", "it", ...]`
   - Called in `masking.engine.ts` before `filterRulesForScope`

2. **Promote US SSN to global** (see 03-engine-fixes.md §Fix 1)
   - Change `coverage: "country"` → `"global"` on all 4 SSN rules
   - SSN is a strong format (3-2-4 dashes, Luhn-like area/group validation)
   - Minimal false-positive risk

3. **UI: region-group picker** (optional, deferred)
   - Allow selecting `"Latin America (ES)"` instead of individual countries
   - Wire to `expandCountryScope`

4. Run full browselite test:
   ```bash
   npx playwright test mock-corpus-browselite --timeout=7200000
   ```

### Validation

| Metric             | After Phase 1 | After Phase 2 |
| ------------------ | ------------: | ------------: |
| Real leaks         |        ~3,646 |          ~238 |
| Cross-scope misses |         3,408 |            ~0 |

---

## Decision Points

| Question                    | Options                                 | Recommendation                  |
| --------------------------- | --------------------------------------- | ------------------------------- |
| SSN to global?              | Promote all 4 / keep country-scoped     | Promote — format is distinctive |
| `latam-es` auto-expansion?  | Yes / manual selection                  | Auto-expansion with opt-out     |
| Mock IBAN repair?           | Fix generator checksums / accept filter | Accept filter (lower effort)    |
| `categorizeLeak` → utility? | Extract to shared util / keep in test   | Keep in test (only used there)  |

---

## Risk Matrix

| Risk                                | Impact | Likelihood | Mitigation                               |
| ----------------------------------- | ------ | ---------- | ---------------------------------------- |
| SSN → global causes false positives | Medium | Low        | `isValidUsaSsn` validator already exists |
| Region expansion too broad          | High   | Medium     | Allow opt-out; default to narrow         |
| CN standalone rule matches non-IDs  | Medium | Low        | `isValidChineseResidentId` mod-11 check  |
| Test changes break CI               | Low    | Low        | Phase 0 is isolated; brownfield test     |

---

## File Change Map

```
Phase 0
  tests/e2e/mock-corpus-browselite.spec.ts  (modify)

Phase 1
  src/app/core/masking/constants/masking-rules.constants.ts  (modify)
  src/app/core/masking/utils/mask-validation.utils.ts        (modify — export)
  src/app/core/masking/masking.engine.spec.ts                (add tests)

Phase 2
  src/app/core/masking/utils/country-scope.utils.ts          (modify — add fn)
  src/app/core/masking/masking.engine.ts                     (modify — call fn)
  src/app/core/masking/types/                                (modify if needed)
```
