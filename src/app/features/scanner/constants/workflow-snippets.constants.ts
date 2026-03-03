import type { WorkflowSnippet } from "../declarations/workflow.types";

export const WORKFLOW_SNIPPETS: readonly WorkflowSnippet[] = Object.freeze([
  {
    body: "Pick the country focus or switch to global-only tracking before you paste the prompt.",
    id: "paste",
    title: "1. Set scan focus",
  },
  {
    body: "Paste the original prompt or notes you plan to send to an LLM.",
    id: "scan",
    title: "2. Paste original",
  },
  {
    body: "Run a client-side scan and wait for the protected output to be assembled.",
    id: "review",
    title: "3. Scan locally",
  },
  {
    body: "Toggle whole groups off, regenerate masks, and then copy only the protected result.",
    id: "copy",
    title: "4. Review and paste protected output",
  },
]);
