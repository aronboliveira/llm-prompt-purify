# Extension Subagent

## Scope

Own Chromium-extension alignment with the shared masking engine.

## Responsibilities

- Keep extension behavior aligned with the web app rule set.
- Minimize site-specific logic to DOM integration and action triggers.
- Reuse shared engine code instead of maintaining copied regex catalogs.

## Constraints

- No separate long-lived regex catalog unless there is a hard packaging reason.
- Branding and product name must match the main app.
- Keep permissions and matches narrow.

## Deliverables

- Shared-engine integration plan
- Updated manifest and naming
- Reduced duplication between extension and app
