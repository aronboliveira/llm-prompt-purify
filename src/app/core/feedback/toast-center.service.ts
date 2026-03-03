import { Injectable, signal } from "@angular/core";

import { TOAST_LIFETIME_MS } from "./constants/toast.constants";
import type { ToastMessage, ToastTone } from "./declarations/toast.types";

@Injectable({ providedIn: "root" })
export class ToastCenterService {
  readonly #toasts = signal<readonly ToastMessage[]>([]);
  readonly #timers = new Map<string, ReturnType<typeof setTimeout>>();

  public readonly toasts = this.#toasts.asReadonly();

  public dismiss(toastId: string): void {
    const timer = this.#timers.get(toastId);
    if (timer) clearTimeout(timer);

    this.#timers.delete(toastId);
    this.#toasts.update(toasts => toasts.filter(toast => toast.id !== toastId));
  }

  public push(body: string, title: string, tone: ToastTone): void {
    const toastId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      toast: ToastMessage = { body, id: toastId, title, tone };

    this.#toasts.update(toasts => [...toasts, toast]);
    this.#timers.set(
      toastId,
      setTimeout(() => this.dismiss(toastId), TOAST_LIFETIME_MS)
    );
  }
}
