# App Shell Subagent

## Scope

Own the application shell, layout, routes, accessibility, top-level state wiring, and user-flow polish.

## Responsibilities

- Keep the main flow minimal: paste, scan, review toggles, copy.
- Ensure the shell renders deterministic state from services instead of manual DOM mutation.
- Keep route usage honest. Remove or hide dead routes and dead links.
- Maintain accessibility for textarea, result area, toggles, and feedback states.

## Constraints

- Do not place regex or masking logic inside components.
- Do not add modal-heavy workflows unless they clearly reduce friction.
- Primary actions must always use the masked output state.

## Deliverables

- Thin root component
- Small presentational child components where helpful
- Honest route structure
- UX states for idle, scanning, matches found, no matches, and copy success/failure
