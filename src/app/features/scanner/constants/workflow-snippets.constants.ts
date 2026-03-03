import type { WorkflowSnippet } from "../declarations/workflow.types";

export const WORKFLOW_SNIPPETS: readonly WorkflowSnippet[] = Object.freeze([
  {
    body: "Paste the original prompt or notes you plan to send to an LLM.",
    id: "paste",
    title: "1. Paste original",
  },
  {
    body: "Run a client-side scan and wait for the protected output to be assembled.",
    id: "scan",
    title: "2. Scan locally",
  },
  {
    body: "Toggle whole groups off, or regenerate specific masks before copying.",
    id: "review",
    title: "3. Review masks",
  },
  {
    body: "Copy only the protected result back into the external LLM.",
    id: "copy",
    title: "4. Paste protected output",
  },
]);
