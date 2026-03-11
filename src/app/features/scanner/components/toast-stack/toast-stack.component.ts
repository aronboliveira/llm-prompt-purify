import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";

import type { ToastMessage } from "@core/feedback/declarations/toast.types";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: "app-toast-stack",
  standalone: true,
  templateUrl: "./toast-stack.component.html",
})
export class ToastStackComponent {
  readonly dismissed = output<string>();
  readonly toasts = input.required<readonly ToastMessage[]>();

  protected dismiss(toastId: string): void {
    this.dismissed.emit(toastId);
  }
}
