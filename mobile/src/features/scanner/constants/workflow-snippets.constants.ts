import type { WorkflowSnippet } from "../declarations/workflow.types";

export const WORKFLOW_SNIPPETS: readonly WorkflowSnippet[] = Object.freeze([
  {
    body: "Choose the country scope you want active, or keep the detector in global-only mode.",
    id: "paste",
    title: "1. Set scope",
  },
  {
    body: "Paste the original prompt in the input area. No submit step is required.",
    id: "scan",
    title: "2. Paste raw version",
  },
  {
    body: "Wait for the short local spinner while the protected output rebuilds.",
    id: "review",
    title: "3. Let it mask locally",
  },
  {
    body: "Disable groups or single masks if needed, then copy only the protected output into the LLM.",
    id: "copy",
    title: "4. Refine and copy",
  },
]);
