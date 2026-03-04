# Feature And Performance Audit

Date: 2026-03-04

## Baseline

The current masking experience is functional and test-covered. The Jest suite passes with 11 suites and 279 tests, and the production build completes successfully. The browser bundle is still reasonable for a single-page tool, but the build also emits a full SSR/server output, including a `server.mjs` bundle above 1 MB raw.

## Main gaps

### 1. The app still feels slower than it needs to

The live masking path deliberately adds latency. The session layer debounces for `260ms` and then waits for a minimum spinner duration of `520ms`, which means the protected output cannot settle in less than roughly `780ms` after the user stops typing. For a “paste, clean, copy” tool, that is unnecessary friction.

This delay is not buying true background work. The scan still runs on the main thread, so large prompts can block the UI anyway. The spinner is mostly visual pacing, not a concurrency boundary.

### 2. Processing work is repeated too often

The engine rebuilds key detection structures on every scan:

- scope filtering runs again for every call
- regex instances are recreated through `patternFactory()`
- Fuse alias entries are rebuilt each time
- a new Fuse matcher is instantiated for each scan

This is acceptable for small prompts, but it is the wrong shape for the hottest path in the product. The app is optimized for correctness and simplicity, not for sustained typing or large prompt throughput.

### 3. The client-side privacy message is partially undermined

The app messaging says the raw prompt stays local, but the current page behavior is broader than that claim suggests. The raw prompt is persisted in `sessionStorage` by default, and the app shell mounts a feedback feature that can POST data to `/api/feedback`. That does not make the masking engine server-side, but it does make the page-level trust boundary less clean than the copy suggests.

### 4. The controls model does not scale gracefully

The mask controls are good for a few matches, but they will become heavy with large prompts or noisy scopes. Every match becomes a separate row, there is no collapse or search, and repeated matches reuse the same `data-testid` suffix based only on `ruleId`, which is awkward for automation and auditing. The current controls surface is optimized for inspection, not scale.

### 5. Deployment scope is larger than the product need

The app is positioned as a client-side sanitizer, yet the Angular build is still configured for SSR and prerendering, with Express server wiring in place. That increases operational complexity, dependency surface, and build size without improving masking quality or privacy.

## Highest-value improvements

### Product and UX

1. Remove the fixed minimum wait for small scans and make the spinner adaptive.
2. Add an explicit privacy mode switch:
   `ephemeral`, `session-only`, `remember settings only`.
3. Separate the feedback feature from the core sanitizer experience or clearly label it as a networked action.
4. Add scalable controls:
   collapse by rule, search by label, bulk toggle by confidence/category, and a “show only enabled masks” filter.
5. Add residual-risk assistance:
   surface suspicious leftovers that still resemble secrets after masking.

### Processing and architecture

1. Move scan execution to a Web Worker so large prompts do not block typing or repaint.
2. Precompile regexes and cache active rule sets by scope.
3. Cache Fuse instances by active fuzzy-rule IDs.
4. Stop writing the raw prompt to storage on every keystroke.
5. Introduce guardrails for large inputs:
   prompt length thresholds, chunking, and optional fuzzy-label disablement for oversized content.

## Concrete evidence

- Main-thread scan call: [scan-session.service.ts](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/src/app/core/state/scan-session.service.ts#L149)
- Debounce and minimum spinner timing: [scan-session.constants.ts](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/src/app/core/state/constants/scan-session.constants.ts#L8)
- Regex creation per scan: [masking.engine.ts](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/src/app/core/masking/masking.engine.ts#L81)
- Fuse rebuild per scan: [fuzzy-label.utils.ts](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/src/app/core/masking/utils/fuzzy-label.utils.ts#L20)
- Raw prompt persistence: [scan-session.service.ts](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/src/app/core/state/scan-session.service.ts#L402)
  and [scan-session-storage.utils.ts](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/src/app/core/state/utils/scan-session-storage.utils.ts#L110)
- Client-side promise in copy: [workspace.constants.ts](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/src/app/features/scanner/constants/workspace.constants.ts#L2)
- Feedback surface mounted in app shell: [app.component.html](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/src/app/app.component.html#L7)
- Feedback network call: [feedback-api.service.ts](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/src/app/core/feedback/feedback-api.service.ts#L14)
- Per-match controls and duplicated test-id pattern: [mask-group-panel.component.html](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/src/app/features/scanner/components/mask-group-panel/mask-group-panel.component.html#L39)
- SSR/prerender build configuration: [angular.json](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/angular.json#L17)
- Express SSR entrypoint: [server.ts](/mnt/sda2/home/aronboliveira/Desktop/programming/LLMPromptPurify/llm-prompt-purify/server.ts#L9)
