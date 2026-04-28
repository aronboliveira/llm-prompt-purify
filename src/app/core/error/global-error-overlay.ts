const OVERLAY_ID = "llmpp-global-error-overlay";
const MAX_QUEUED_ERRORS = 5;

interface ErrorEntry {
  readonly title: string;
  readonly detail: string;
}

const queue: ErrorEntry[] = [];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function setStyles(el: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  Object.assign(el.style, styles);
}

function describe(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

function buildOverlay(): HTMLElement {
  const backdrop = document.createElement("div");
  backdrop.id = OVERLAY_ID;
  backdrop.setAttribute("role", "alertdialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.setAttribute("aria-labelledby", `${OVERLAY_ID}-title`);
  backdrop.setAttribute("aria-describedby", `${OVERLAY_ID}-body`);
  setStyles(backdrop, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "rgba(15, 23, 42, 0.62)",
    backdropFilter: "blur(4px)",
    fontFamily: '"Trebuchet MS", "Avenir Next", sans-serif',
  });

  const card = document.createElement("section");
  setStyles(card, {
    width: "min(520px, 100%)",
    maxHeight: "80vh",
    overflow: "auto",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow:
      "0 32px 80px rgba(15, 23, 42, 0.32), 0 0 0 1px rgba(15, 118, 110, 0.18)",
    color: "#0f172a",
    borderTop: "4px solid #0f766e",
  });

  const header = document.createElement("header");
  setStyles(header, {
    padding: "20px 24px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  });

  const eyebrow = document.createElement("span");
  eyebrow.textContent = "Unexpected error";
  setStyles(eyebrow, {
    fontSize: "11px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#b45309",
    fontWeight: "700",
  });
  header.appendChild(eyebrow);

  const title = document.createElement("h2");
  title.id = `${OVERLAY_ID}-title`;
  title.textContent = "Something went wrong";
  setStyles(title, {
    margin: "0",
    fontSize: "22px",
    lineHeight: "1.2",
    fontWeight: "700",
    color: "#0f172a",
  });
  header.appendChild(title);

  const body = document.createElement("div");
  body.id = `${OVERLAY_ID}-body`;
  setStyles(body, {
    padding: "8px 24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    fontSize: "14px",
    lineHeight: "1.55",
    color: "#2b4356",
  });

  const lede = document.createElement("p");
  lede.textContent =
    "The application hit an unhandled error. Your prompt text has not left this device. You can dismiss this notice or reload the page.";
  setStyles(lede, { margin: "0" });
  body.appendChild(lede);

  const list = document.createElement("ul");
  list.dataset["role"] = "errors";
  setStyles(list, {
    margin: "0",
    padding: "0",
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  });
  body.appendChild(list);

  const footer = document.createElement("footer");
  setStyles(footer, {
    padding: "12px 24px 20px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  });

  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.textContent = "Dismiss";
  setStyles(dismiss, {
    appearance: "none",
    border: "1px solid rgba(15, 118, 110, 0.32)",
    background: "transparent",
    color: "#0f766e",
    padding: "9px 16px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
  });
  dismiss.addEventListener("click", () => {
    backdrop.remove();
    queue.length = 0;
  });

  const reload = document.createElement("button");
  reload.type = "button";
  reload.textContent = "Reload page";
  setStyles(reload, {
    appearance: "none",
    border: "1px solid #0f766e",
    background: "#0f766e",
    color: "#ffffff",
    padding: "9px 16px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
  });
  reload.addEventListener("click", () => {
    window.location.reload();
  });

  footer.appendChild(dismiss);
  footer.appendChild(reload);

  card.appendChild(header);
  card.appendChild(body);
  card.appendChild(footer);
  backdrop.appendChild(card);

  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) {
      backdrop.remove();
      queue.length = 0;
    }
  });

  return backdrop;
}

function renderEntries(overlay: HTMLElement): void {
  const list = overlay.querySelector<HTMLUListElement>('ul[data-role="errors"]');
  if (!list) return;
  list.replaceChildren();

  for (const entry of queue) {
    const item = document.createElement("li");
    setStyles(item, {
      borderLeft: "3px solid #f59e0b",
      background: "rgba(245, 158, 11, 0.08)",
      padding: "10px 12px",
      borderRadius: "0 8px 8px 0",
    });

    const heading = document.createElement("p");
    heading.textContent = entry.title;
    setStyles(heading, {
      margin: "0 0 6px",
      fontWeight: "600",
      color: "#0f172a",
      fontSize: "13px",
    });
    item.appendChild(heading);

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Show technical detail";
    setStyles(summary, {
      cursor: "pointer",
      fontSize: "12px",
      color: "#3c5669",
    });
    details.appendChild(summary);

    const pre = document.createElement("pre");
    pre.textContent = entry.detail;
    setStyles(pre, {
      margin: "8px 0 0",
      padding: "10px",
      background: "#0f172a",
      color: "#e2e8f0",
      borderRadius: "6px",
      fontSize: "11.5px",
      lineHeight: "1.45",
      maxHeight: "200px",
      overflow: "auto",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      fontFamily: 'ui-monospace, "Cascadia Code", Menlo, Consolas, monospace',
    });
    details.appendChild(pre);

    item.appendChild(details);
    list.appendChild(item);
  }
}

export function showGlobalErrorOverlay(title: string, error: unknown): void {
  if (!isBrowser()) return;

  const detail = describe(error);
  const last = queue[queue.length - 1];
  if (last && last.title === title && last.detail === detail) return;

  queue.push({ title, detail });
  if (queue.length > MAX_QUEUED_ERRORS) queue.shift();

  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = buildOverlay();
    document.body.appendChild(overlay);
  }
  renderEntries(overlay);
}
