# Friction and Failure Analysis

## Highest-impact defects

### 1. The primary page actions are unsafe or ineffective

- The main copy button copies `this.userInput`, not the masked output. See `src/app/app.component.ts:150-160` and `src/app/app.component.html:22-30`.
- The main download button constructs `OutputBuilder` but never calls `exportCompressed()`. See `src/app/app.component.ts:162-167` and `src/app/libs/builders/OutputBuilder.ts:18-20`.
- `processedOutput` is shown on the page, but it is never updated with the final masked prompt. See `src/app/app.component.html:19` and `src/app/app.component.ts:123-149`.

Impact:

- users can believe they are copying a safe result while actually copying the raw prompt
- download appears available before it really works
- the main screen does not behave like a reliable "sanitize then copy" tool

### 2. The scan engine is both noisy and unstable

- `checkPrompt()` uses deeply nested loops and repeatedly calls `exp.exec(this.userInput)` on shared regex instances from `MAIN_DICT`. See `src/app/app.component.ts:219-231`.
- Many regexes in `MAIN_DICT` use the global flag, so internal regex state can leak across iterations and scans. Examples start at `src/app/libs/vars/dictionaries.ts:3`, `:5`, `:12`, `:15`, and continue through most of the file.
- The dictionary mixes real secrets with generic technical vocabulary such as `HEALTHCHECK`, `AUTH`, `LARAVEL`, `SPRING_BOOT`, `DJANGO`, `EXPRESS`, `SWAGGER`, and `GRAPHQL`. See `src/app/libs/vars/dictionaries.ts:36-58`.
- Some rules are extremely broad, for example `ENV_VAR`, `API_KEY`, `BANK_ACCOUNT`, `ROUTING_NUMBER`, and several label patterns. See `src/app/libs/vars/dictionaries.ts:9-10`, `:23`, `:186-205`.

Impact:

- false positives are likely when the user asks normal engineering questions
- false negatives are possible because regex state is reused
- confidence in results drops quickly after a few obviously wrong detections

### 3. Label detection is being treated like sensitive-value detection

- A large part of the dictionary matches labels like `name:`, `email:`, `address:`, `passport number:` rather than the secret values themselves. See `src/app/libs/vars/dictionaries.ts:122-205`.
- The masking UI then proposes masks for those matches as if they were sensitive payloads.

Impact:

- users are forced to review noise
- the UI spends attention on field names instead of the actual private data
- the product feels pedantic instead of helpful

## UX friction

### 4. The main workflow is too manual

- The user has to scan, read a warning modal, open a second dialog, interpret a generated table, decide which checkboxes to keep, possibly regenerate masks, then copy from the modal.
- `Swal.fire(...)` is not awaited before the code starts querying modal buttons and building the dialog. See `src/app/app.component.ts:306-359`.
- The cancel/confirm semantics are unclear. The code assigns tooltips that imply "keep masks" or "remove masks", but the visible button labels do not communicate that clearly. See `src/app/app.component.ts:315-355`.
- There are hard-coded delays even after processing completes. See `src/app/app.component.ts:182`, `:271-278`.

Impact:

- the path from paste -> safe output is longer than it should be
- the app feels unpredictable because UI state changes are timing-dependent
- users who want a quick safe rewrite are pushed into a review-heavy workflow every time

### 5. Navigation and support surfaces are incomplete

- The header links point to `/feedback` and `/contact`, but the app routes are empty. See `src/app/fixed-header/fixed-header.component.html:15-33` and `src/app/app.routes.ts:1-2`.
- `FeedbackFormComponent` and `ContactFormComponent` only show `alert(...)` placeholders. See `src/app/feedback-form/feedback-form.component.ts:16-18` and `src/app/contact-form/contact-form.component.ts:18-20`.
- `src/app/under-development/under-development.component.html` is effectively empty.

Impact:

- users can click into dead ends
- the product communicates incompleteness at the exact point where trust is needed

## Maintainability and correctness risks

### 6. Dialog state management is incomplete

- `InfoDialogService.openPromptTable()` never sets `#isPromptTableOpen` to `true`, unlike `openHelp()`. See `src/app/libs/state/info-dialog.service.ts:29-42`.

Impact:

- dialog-open state can drift from reality
- toggle behavior is harder to reason about and test

### 7. Performance and memory behavior are fragile

- `checkPrompt()` repeats regex work inside several nested loops, including an unused `j` loop. See `src/app/app.component.ts:221-227`.
- `FixedHeaderComponent` starts repeated `setInterval` work every 250ms and does not clear the inner margin-adjustment interval. See `src/app/fixed-header/fixed-header.component.ts:77-117`.
- `TableExecutive` includes debugging logs and a fallback loop with an unconditional `break`, which makes the code fragile. See `src/app/libs/utils/dom/executives/TableExecutive.ts:138-140` and `:177-181`.

Impact:

- unnecessary CPU churn
- harder diagnosis of real failures because console noise is high
- UI behavior may degrade over time

### 8. Rule duplication is already drifting

- The web app uses `src/app/libs/vars/dictionaries.ts`.
- The extension ships a separate version in `chromium-extension/app/content.js`.
- There is also `_extension.js`.
- The extension has already commented out some noisier patterns that still exist in the web app, which is direct evidence of drift. Compare `chromium-extension/app/content.js:7-65` with `src/app/libs/vars/dictionaries.ts:3-58`.

Impact:

- fixes to detection quality have to be repeated manually
- the web app and extension will behave differently for the same prompt

## Documentation and packaging mismatch

- README says the Chromium extension is available in the `extension` branch, but extension files are present in this repo. See `README.md:16-19`.
- README claims an Angular + Express stack and features like heuristic analysis, multi-threading, whitelist management, and a plugin system. See `README.md:35-39`, `:141-147`.
- Those claims are not reflected in the current implementation.
- The extension manifest is branded as `LLMAlert`, not `LLM Prompt Purify`. See `chromium-extension/app/manifest.json:3-5`.

Impact:

- product expectations are set above the current delivery
- users and contributors will struggle to tell what is real versus planned
