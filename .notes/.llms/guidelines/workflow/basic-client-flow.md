# Basic Client Flow

The application must preserve a low-friction client-side workflow:

1. The user pastes the original prompt into the input textarea.
2. The user triggers a local scan and sees a suspense or spinner state while masking is computed.
3. The protected result is rendered in an explicit `<output>` block.
4. The user reviews mask groups and individual matches, optionally disabling or regenerating masks.
5. The user copies only the protected output back into the external LLM.

Non-negotiable communication rules:

- State clearly that the scan and masking happen inside the browser.
- Explain that the engine is pattern-based and can still miss unsupported sensitive formats.
- Keep copy actions bound to the protected output only.
- Use visible feedback for scan start, scan complete, copy, group changes, and regeneration.

Content guidance:

- Input copy should explain what goes in the textarea.
- Output copy should explain that the result is the only text meant to leave the page.
- Help modals opened with `(?)` should explain workflow, current detection limits, and the reason for group controls.
