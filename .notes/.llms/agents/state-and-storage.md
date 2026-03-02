# State and Storage Subagent

## Scope

Own application state modeling, persistence, serialization, and recovery.

## Responsibilities

- Keep scan session state small and serializable.
- Persist only what improves user continuity:
  - current input
  - last scan result if still valid
  - user toggle state when safe
- Centralize storage keys and schema versions.

## Constraints

- Never persist more raw sensitive material than necessary.
- Prefer session storage over local storage for prompt content.
- Persist masked output only when it is directly derived from current state and can be safely reconstructed.

## Deliverables

- State contracts
- Storage constants
- Persistence service
- Safe hydration and invalidation logic
