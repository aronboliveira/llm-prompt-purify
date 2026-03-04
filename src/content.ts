/**
 * LLM Prompt Purifier - Content Script Entry Point
 * Detects sensitive data in LLM chat prompts and suggests safe masks
 * @version 1.3.0
 * @license MIT
 */

import { CONFIG, INPUT_SELECTORS, ICONS } from "./constants";
import {
  $,
  hashString,
  debounce,
  escapeHtml,
  isVisible,
  createElement,
  getInputText,
} from "./utils";
import { detectSensitiveData, generateMasks } from "./detection";
import type { State, Detection } from "./types";

// Prevent multiple injections
if (window.__LLM_PURIFY_LOADED__) {
  throw new Error("LLM Purify already loaded");
}
window.__LLM_PURIFY_LOADED__ = true;

// ═══════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════
const state: State = {
  toastEl: null,
  suggestionsEl: null,
  hintEl: null,
  quickbarEl: null,
  lastText: "",
  lastTextHash: 0,
  detections: [],
  isSubtle: false,
  fadeTimeout: null,
  inputRef: null,
  observer: null,
  scanIntervalId: null,
  abortController: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const createToast = (): HTMLElement => {
  if (state.toastEl) return state.toastEl;

  const toast = createElement("aside", {
    id: CONFIG.TOAST_ID,
    className: "llm-purify-toast",
    role: "alertdialog",
    "aria-live": "polite",
    "aria-atomic": "true",
    "aria-labelledby": "llm-purify-toast-title",
    "aria-describedby": "llm-purify-toast-desc",
    "aria-hidden": "true",
    tabindex: "-1",
  });

  toast.innerHTML = `
    <header class="llm-purify-toast-header">
      <h2 id="llm-purify-toast-title" class="llm-purify-toast-title">
        ${ICONS.warning}
        <span>Sensitive Data Detected</span>
      </h2>
      <button type="button" class="llm-purify-toast-close" aria-label="Dismiss notification" data-action="close">
        ${ICONS.close}
      </button>
    </header>
    <div id="llm-purify-toast-desc" class="llm-purify-toast-body">
      <p class="llm-purify-toast-message">
        Your prompt contains <strong class="llm-purify-detected-count" aria-live="polite">0</strong> sensitive item(s) that may be exposed.
      </p>
      <ul class="llm-purify-detected-preview" role="list" aria-label="Detected sensitive data types"></ul>
    </div>
    <footer class="llm-purify-toast-actions">
      <button type="button" class="llm-purify-btn llm-purify-btn-primary" data-action="masks" aria-expanded="false" aria-controls="${CONFIG.SUGGESTIONS_ID}">
        ${ICONS.eye}
        <span>View Masks</span>
      </button>
      <button type="button" class="llm-purify-btn llm-purify-btn-ghost" data-action="dismiss">
        Dismiss
      </button>
    </footer>
  `;

  toast.addEventListener("click", handleToastClick, { passive: true });
  toast.addEventListener("keydown", handleToastKeydown);

  document.body.appendChild(toast);
  state.toastEl = toast;
  return toast;
};

const createSuggestionsPanel = (): HTMLElement => {
  if (state.suggestionsEl) return state.suggestionsEl;

  const panel = createElement("section", {
    id: CONFIG.SUGGESTIONS_ID,
    className: "llm-purify-suggestions",
    role: "dialog",
    "aria-labelledby": "llm-purify-suggestions-title",
    "aria-hidden": "true",
    "aria-modal": "false",
    tabindex: "-1",
  });

  panel.innerHTML = `
    <header class="llm-purify-suggestions-header">
      <h3 id="llm-purify-suggestions-title" class="llm-purify-suggestions-title">Suggested Masks</h3>
      <button type="button" class="llm-purify-toast-close" aria-label="Close suggestions panel" data-action="close-suggestions">
        ${ICONS.close}
      </button>
    </header>
    <div class="llm-purify-suggestions-list" role="list" aria-label="List of mask suggestions"></div>
  `;

  panel.addEventListener("click", handleSuggestionsClick, { passive: false });
  panel.addEventListener("keydown", handleSuggestionsKeydown);

  document.body.appendChild(panel);
  state.suggestionsEl = panel;
  return panel;
};

const createHintBar = (): HTMLElement => {
  if (state.hintEl) return state.hintEl;

  const hint = createElement("div", {
    id: CONFIG.HINT_ID,
    className: "llm-purify-hint",
    role: "status",
    "aria-live": "polite",
    "aria-atomic": "true",
  });

  hint.innerHTML = `
    <span class="llm-purify-hint-icon">${ICONS.warning}</span>
    <span class="llm-purify-hint-text">Sensitive data</span>
    <span class="llm-purify-hint-count">0</span>
    <span class="llm-purify-hint-keys">
      <kbd class="llm-purify-key llm-purify-key-accept">Tab</kbd>
      <span class="llm-purify-key-action">view</span>
      <kbd class="llm-purify-key llm-purify-key-reject">Esc</kbd>
      <span class="llm-purify-key-action">hide</span>
    </span>
  `;

  document.body.appendChild(hint);
  state.hintEl = hint;
  return hint;
};

const createQuickbar = (): HTMLElement => {
  if (state.quickbarEl) return state.quickbarEl;

  const bar = createElement("div", {
    id: CONFIG.QUICKBAR_ID,
    className: "llm-purify-quickbar",
    role: "toolbar",
    "aria-label": "Quick actions for detected sensitive data",
  });

  bar.innerHTML = `
    <button type="button" class="llm-purify-qb-btn llm-purify-qb-accept" data-action="qb-accept" title="Accept: Apply all masks">
      ${ICONS.shield}
      <span>Mask All</span>
      <kbd class="llm-purify-qb-key">Tab</kbd>
    </button>
    <button type="button" class="llm-purify-qb-btn llm-purify-qb-view" data-action="qb-view" title="View masks">
      ${ICONS.eye}
      <span>View</span>
      <kbd class="llm-purify-qb-key">V</kbd>
    </button>
    <button type="button" class="llm-purify-qb-btn llm-purify-qb-reject" data-action="qb-reject" title="Dismiss warning">
      ${ICONS.x}
      <span>Ignore</span>
      <kbd class="llm-purify-qb-key">Esc</kbd>
    </button>
  `;

  bar.addEventListener("click", handleQuickbarClick, { passive: true });

  document.body.appendChild(bar);
  state.quickbarEl = bar;
  return bar;
};

// ═══════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

function handleToastClick(e: Event): void {
  const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === "close" || action === "dismiss") hideToast();
  else if (action === "masks") toggleSuggestions();
}

function handleToastKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") hideToast();
}

function handleSuggestionsClick(e: Event): void {
  const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!btn) return;
  e.preventDefault();

  const action = btn.dataset.action;
  if (action === "close-suggestions") {
    hideSuggestions();
  } else if (action === "copy") {
    const mask = btn.dataset.mask;
    if (!mask) return;
    navigator.clipboard
      .writeText(mask)
      .then(() => {
        btn.innerHTML = `${ICONS.check}<span>Copied!</span>`;
        btn.setAttribute("aria-label", "Copied to clipboard");
        setTimeout(() => {
          btn.innerHTML = `${ICONS.copy}<span>Copy</span>`;
          btn.setAttribute("aria-label", "Copy mask to clipboard");
        }, 1500);
      })
      .catch(() => {
        btn.textContent = "Failed";
      });
  }
}

function handleSuggestionsKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") hideSuggestions();
}

function handleQuickbarClick(e: Event): void {
  const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === "qb-accept") applyAllMasks();
  else if (action === "qb-view") showSuggestions();
  else if (action === "qb-reject") dismissAll();
}

// ═══════════════════════════════════════════════════════════════════════════
// MASKING
// ═══════════════════════════════════════════════════════════════════════════

function applyAllMasks(): void {
  const input = state.inputRef?.deref();
  if (!input || state.detections.length === 0) return;

  let text = getInputText(input);
  const sorted = [...state.detections].sort((a, b) => b.start - a.start);

  sorted.forEach(d => {
    text = text.slice(0, d.start) + d.mask + text.slice(d.end);
  });

  if (
    input instanceof HTMLInputElement ||
    input instanceof HTMLTextAreaElement
  ) {
    input.value = text;
    input.dispatchEvent(
      new InputEvent("input", { bubbles: true, inputType: "insertText" }),
    );
  } else if (input.isContentEditable) {
    input.textContent = text;
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }

  state.detections = [];
  state.lastText = text;
  state.lastTextHash = hashString(text);
  dismissAll();

  requestAnimationFrame(() => input.focus());
}

function dismissAll(): void {
  hideToast();
  hideHint();
  hideQuickbar();
}

// ═══════════════════════════════════════════════════════════════════════════
// VISIBILITY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

function showToast(detections: Detection[]): void {
  const toast = createToast();

  const countEl = toast.querySelector(".llm-purify-detected-count");
  if (countEl) countEl.textContent = String(detections.length);

  const preview = toast.querySelector(".llm-purify-detected-preview");
  if (preview) {
    const frag = document.createDocumentFragment();

    detections.slice(0, CONFIG.MAX_DETECTIONS_PREVIEW).forEach(d => {
      const li = createElement("li", {
        className: "llm-purify-detected-tag",
        title: d.value,
        role: "listitem",
      });
      li.textContent = d.label;
      frag.appendChild(li);
    });

    if (detections.length > CONFIG.MAX_DETECTIONS_PREVIEW) {
      const more = createElement("li", {
        className: "llm-purify-detected-tag llm-purify-tag-more",
        role: "listitem",
      });
      more.textContent = `+${detections.length - CONFIG.MAX_DETECTIONS_PREVIEW} more`;
      frag.appendChild(more);
    }

    preview.replaceChildren(frag);
  }

  requestAnimationFrame(() => {
    toast.classList.add("show");
    toast.classList.remove("subtle");
    toast.setAttribute("aria-hidden", "false");
    toast.classList.add("pulse");
    setTimeout(() => toast.classList.remove("pulse"), 600);
  });

  showHint(detections.length);
  showQuickbar();

  state.isSubtle = false;
  if (state.fadeTimeout) clearTimeout(state.fadeTimeout);
  state.fadeTimeout = setTimeout(() => {
    if (toast.classList.contains("show")) {
      toast.classList.add("subtle");
      state.isSubtle = true;
    }
  }, CONFIG.FADE_DELAY_MS);
}

function hideToast(): void {
  if (!state.toastEl) return;
  state.toastEl.classList.remove("show", "subtle");
  state.toastEl.setAttribute("aria-hidden", "true");
  hideSuggestions();
  if (state.fadeTimeout) {
    clearTimeout(state.fadeTimeout);
    state.fadeTimeout = null;
  }
}

function showSuggestions(): void {
  const panel = createSuggestionsPanel();
  const list = panel.querySelector(".llm-purify-suggestions-list");
  if (!list) return;

  const frag = document.createDocumentFragment();

  state.detections.forEach((detection, idx) => {
    const masks = generateMasks(detection);
    const item = createElement("article", {
      className: "llm-purify-suggestion-item",
      role: "listitem",
      "aria-labelledby": `mask-type-${idx}`,
    });

    const truncatedValue =
      detection.value.length > 30
        ? `${detection.value.slice(0, 30)}...`
        : detection.value;

    item.innerHTML = `
      <div id="mask-type-${idx}" class="llm-purify-suggestion-type">${escapeHtml(detection.label)}</div>
      <div class="llm-purify-suggestion-original" aria-label="Original value">${escapeHtml(truncatedValue)}</div>
      <span class="llm-purify-suggestion-arrow" aria-hidden="true">↓</span>
      ${masks
        .map(
          (m, mi) => `
        <div class="llm-purify-suggestion-masked" aria-label="Suggested mask ${mi + 1}">${escapeHtml(m)}</div>
        <button type="button" class="llm-purify-copy-btn" data-action="copy" data-mask="${escapeHtml(m)}" aria-label="Copy mask to clipboard">
          ${ICONS.copy}<span>Copy</span>
        </button>
      `,
        )
        .join("")}
    `;
    frag.appendChild(item);
  });

  list.replaceChildren(frag);

  requestAnimationFrame(() => {
    panel.classList.add("show");
    panel.setAttribute("aria-hidden", "false");
    const masksBtn = state.toastEl?.querySelector('[data-action="masks"]');
    if (masksBtn) masksBtn.setAttribute("aria-expanded", "true");
    panel.focus();
  });
}

function hideSuggestions(): void {
  if (!state.suggestionsEl) return;
  state.suggestionsEl.classList.remove("show");
  state.suggestionsEl.setAttribute("aria-hidden", "true");
  const masksBtn = state.toastEl?.querySelector('[data-action="masks"]');
  if (masksBtn) masksBtn.setAttribute("aria-expanded", "false");
}

function toggleSuggestions(): void {
  if (state.suggestionsEl?.classList.contains("show")) hideSuggestions();
  else showSuggestions();
}

function showHint(count: number): void {
  const hint = createHintBar();
  const countEl = hint.querySelector(".llm-purify-hint-count");
  if (countEl) countEl.textContent = String(count);
  requestAnimationFrame(() => hint.classList.add("show"));
}

function hideHint(): void {
  state.hintEl?.classList.remove("show");
}

function showQuickbar(): void {
  const bar = createQuickbar();
  const input = state.inputRef?.deref();
  if (input) {
    const rect = input.getBoundingClientRect();
    bar.style.bottom = `${window.innerHeight - rect.top + 8}px`;
    bar.style.right = "16px";
  } else {
    bar.style.bottom = "100px";
    bar.style.right = "16px";
  }
  requestAnimationFrame(() => bar.classList.add("show"));
}

function hideQuickbar(): void {
  state.quickbarEl?.classList.remove("show");
}

// ═══════════════════════════════════════════════════════════════════════════
// INPUT MONITORING
// ═══════════════════════════════════════════════════════════════════════════

function findInputElement(): HTMLElement | null {
  for (let i = 0, len = INPUT_SELECTORS.length; i < len; i++) {
    const el = $<HTMLElement>(INPUT_SELECTORS[i]);
    if (
      el &&
      isVisible(el) &&
      (el.tagName === "TEXTAREA" ||
        el.tagName === "INPUT" ||
        (el as HTMLElement).isContentEditable)
    ) {
      return el;
    }
  }
  return null;
}

function scanInput(): void {
  let input: HTMLElement | null | undefined = state.inputRef?.deref();
  if (!input || !document.body.contains(input)) {
    input = findInputElement();
    state.inputRef = input ? new WeakRef(input) : null;
  }
  if (!input) return;

  const text = getInputText(input);
  const textHash = hashString(text);

  if (textHash === state.lastTextHash && text === state.lastText) return;

  if (text.length < 3) {
    if (state.detections.length > 0) {
      state.detections = [];
      hideToast();
    }
    state.lastText = text;
    state.lastTextHash = textHash;
    return;
  }

  state.lastText = text;
  state.lastTextHash = textHash;

  if (text.length > CONFIG.MAX_PROMPT_LENGTH) return;

  const detections = detectSensitiveData(text);
  state.detections = detections;

  if (detections.length > 0) {
    showToast(detections);
  } else {
    hideToast();
  }
}

const debouncedScan = debounce(scanInput, CONFIG.DEBOUNCE_MS);

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

function init(): void {
  state.abortController = new AbortController();
  const { signal } = state.abortController;

  state.scanIntervalId = setInterval(scanInput, CONFIG.SCAN_INTERVAL_MS);

  document.addEventListener(
    "input",
    (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      for (let i = 0, len = INPUT_SELECTORS.length; i < len; i++) {
        if (target.matches?.(INPUT_SELECTORS[i])) {
          debouncedScan();
          return;
        }
      }
    },
    { capture: true, passive: true, signal },
  );

  document.addEventListener(
    "keydown",
    (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        if (state.toastEl?.classList.contains("show")) {
          dismissAll();
        } else if (state.detections.length > 0) {
          showToast(state.detections);
        }
        return;
      }

      if (
        state.hintEl?.classList.contains("show") &&
        state.detections.length > 0
      ) {
        const activeEl = document.activeElement;
        const isInputFocused =
          activeEl &&
          (activeEl.tagName === "INPUT" ||
            activeEl.tagName === "TEXTAREA" ||
            (activeEl as HTMLElement).isContentEditable);

        if (e.key === "Tab" && isInputFocused && !e.shiftKey) {
          e.preventDefault();
          applyAllMasks();
          return;
        }

        if (
          (e.key === "v" || e.key === "V") &&
          isInputFocused &&
          !e.ctrlKey &&
          !e.metaKey
        ) {
          e.preventDefault();
          showSuggestions();
          return;
        }

        if (e.key === "Escape") {
          dismissAll();
          return;
        }
      }
    },
    { signal },
  );

  state.observer = new MutationObserver(() => {
    const currentInput = state.inputRef?.deref();
    if (!currentInput || !document.body.contains(currentInput)) {
      state.inputRef = null;
      debouncedScan();
    }
  });

  state.observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        if (state.scanIntervalId) {
          clearInterval(state.scanIntervalId);
          state.scanIntervalId = null;
        }
      } else {
        if (!state.scanIntervalId) {
          state.scanIntervalId = setInterval(
            scanInput,
            CONFIG.SCAN_INTERVAL_MS,
          );
        }
      }
    },
    { signal },
  );

  console.info(
    "[LLM Prompt Purifier] v1.3.0 loaded - Tab=Mask, Esc=Dismiss, V=View, Alt+Shift+P=Toggle",
  );
}

function cleanup(): void {
  state.abortController?.abort();
  state.observer?.disconnect();
  if (state.scanIntervalId) clearInterval(state.scanIntervalId);
  if (state.fadeTimeout) clearTimeout(state.fadeTimeout);
  debouncedScan.cancel();
  state.toastEl?.remove();
  state.suggestionsEl?.remove();
  state.hintEl?.remove();
  state.quickbarEl?.remove();
  delete window.__LLM_PURIFY_LOADED__;
}

window.__LLM_PURIFY_CLEANUP__ = cleanup;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  requestAnimationFrame(init);
}
