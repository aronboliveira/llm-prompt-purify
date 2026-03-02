# Architecture and User Flow

## Repository map

- `src/app/` contains the Angular UI.
- `src/app/app.component.ts` currently owns most of the product logic: input handling, scanning, modal opening, DOM table generation, masking, copy, and download triggers.
- `src/app/libs/vars/dictionaries.ts` is the central detection corpus for the web app.
- `chromium-extension/app/content.js` contains a separate copy of the detection logic for the extension.
- `_extension.js` contains yet another copy of that rule set.
- `server.ts` is standard Angular SSR boilerplate, not a real API layer.

## Current web flow

1. User pastes text into the textarea in `src/app/app.component.html`.
2. `checkPrompt()` in `src/app/app.component.ts` scans the full input against every regex in `MAIN_DICT`.
3. If matches are found, the app shows a SweetAlert warning and opens a dialog through `InfoDialogService`.
4. The app then imperatively injects a table and a masked-output block into the dialog.
5. The user manually reviews checkboxes and regenerated masks.
6. The user can copy from the modal, but the main screen actions are not wired to the masked output correctly.

## Architectural observations

- The product logic is concentrated in one large component instead of a pure scanning service plus thin UI.
- DOM creation is heavily imperative. Angular is mostly being used as a shell around manual DOM mutation.
- Detection, masking, presentation, sorting, and interaction state are coupled together.
- The extension and web app do not share one source of truth for detection rules.

## Why this matters

The current design increases both user friction and implementation fragility:

- UI failures can break masking, even when detection works.
- detection changes have to be copied across multiple files
- it is hard to test the core behavior without rendering dialogs and tables
- performance work is harder because scan logic is tangled with modal and DOM timing logic
