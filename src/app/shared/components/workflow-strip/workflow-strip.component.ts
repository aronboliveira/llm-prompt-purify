import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type { WorkflowSnippet, WorkflowState } from "./workflow-strip.types";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-workflow-strip",
  standalone: true,
  styleUrl: "./workflow-strip.component.scss",
  templateUrl: "./workflow-strip.component.html",
})
export class WorkflowStripComponent {
  readonly snippets = input.required<readonly WorkflowSnippet[]>();
  readonly stateResolver =
    input.required<(snippetId: string) => WorkflowState>();
  readonly footerText = input<string>();
}
