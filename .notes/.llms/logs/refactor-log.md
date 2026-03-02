# Refactor Log

## 2026-03-02

- Initialized Angular-focused `.notes/.llms` guidance for the overhaul.
- Replaced the previous Vue-oriented coding style rules with Angular-specific architectural, state, and testing guidance.
- Defined subagent scopes for app shell, masking engine, state/storage, testing, and extension alignment.
- Replaced the default test plan with explicit Jest and Playwright configuration files so the upcoming refactor can validate pure engine logic and the critical browser flow.
- Replaced the DOM-heavy masking prototype with a pure masking engine, a signal-backed session service, and an inline review workflow.
- Removed the dead Angular prototype directories and started pruning obsolete dependencies from the previous Material and Karma stack.
- Validated the overhauled app with a successful production build, passing Jest coverage for the masking engine and state layer, and passing Playwright workflow checks.
