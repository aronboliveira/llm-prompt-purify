/**
 * LLM Prompt Purifier - Utility Functions
 * @version 1.3.0
 */

import type { ElementAttrs } from "./types";

/** Query selector shorthand */
export const $ = <T extends Element = Element>(
  sel: string,
  ctx: ParentNode = document,
): T | null => ctx.querySelector<T>(sel);

/** Query selector all shorthand */
export const $$ = <T extends Element = Element>(
  sel: string,
  ctx: ParentNode = document,
): T[] => [...ctx.querySelectorAll<T>(sel)];

/** Simple hash for quick text comparison */
export const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
};

/** Debounce with cancellation support */
export interface DebouncedFunction<T extends (...args: unknown[]) => void> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

export const debounce = <T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): DebouncedFunction<T> => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  }) as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
};

/** Safe HTML escaping using template */
export const escapeHtml = (() => {
  const el = document.createElement("span");
  return (text: string): string => {
    el.textContent = text;
    return el.innerHTML;
  };
})();

/** Check if element is visible in viewport */
export const isVisible = (el: Element | null): boolean => {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top < window.innerHeight &&
    rect.bottom > 0
  );
};

/** Create element with attributes */
export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: ElementAttrs = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] => {
  const el = document.createElement(tag);

  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined) continue;
    if (k === "className" && typeof v === "string") el.className = v;
    else if (k === "dataset" && typeof v === "object")
      Object.assign(el.dataset, v);
    else if (
      (k.startsWith("aria") || k.startsWith("data-")) &&
      typeof v === "string"
    ) {
      el.setAttribute(k.replace(/([A-Z])/g, "-$1").toLowerCase(), v);
    } else if (
      (k === "textContent" || k === "innerHTML") &&
      typeof v === "string"
    ) {
      el[k] = v;
    } else if (typeof v === "string") el.setAttribute(k, v);
  }

  children.forEach(c => {
    if (c)
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });

  return el;
};

/** Get text from an input element */
export const getInputText = (el: HTMLElement | null): string => {
  if (!el) return "";
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value || "";
  }
  return el.innerText || el.textContent || "";
};
