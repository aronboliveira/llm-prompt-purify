import { showGlobalErrorOverlay } from "./global-error-overlay";

let installed = false;

export function installGlobalErrorListeners(): void {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", event => {
    const detail = event.error ?? event.message ?? "Unknown error";
    showGlobalErrorOverlay("Uncaught error", detail);
  });

  window.addEventListener("unhandledrejection", event => {
    const detail = event.reason ?? "Unhandled promise rejection";
    showGlobalErrorOverlay("Unhandled promise rejection", detail);
  });
}
