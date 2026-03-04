export interface WorkflowSnippet {
  readonly id: string;
  readonly title: string;
  readonly body: string;
}

export type WorkflowState = "idle" | "active" | "done";
