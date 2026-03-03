# Translator Workspace Contract

The primary workflow is now a live translator-style masking surface:

1. The user chooses one or more country scopes, or switches to global-only detection.
2. The user pastes the raw prompt in the left textarea.
3. A short client-side spinner appears while the protected output is rebuilt locally.
4. The masked result is rendered in a real `<output>` block on the right.
5. The user can disable whole groups, disable single masks, or regenerate replacements inline.
6. Only the protected output may be copied into the target LLM.

Design constraints:

- The raw prompt must never be the target of the primary copy action.
- Multi-country selections are allowed, but mixed language families must raise a visible warning.
- Group and per-match controls belong to the same workspace, not a secondary review screen.
- Modals opened from `(?)`, country scope, or settings triggers must explain what the detector can still miss.
- All masking behavior remains client-side and session-local unless the user copies text out manually.
