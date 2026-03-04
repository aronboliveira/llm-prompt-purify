/**
 * LLM Prompt Purifier - Type Definitions
 * @version 1.3.0
 */

export interface PatternDefinition {
  regex: RegExp;
  label: string;
  mask: string;
}

export interface Detection {
  type: string;
  label: string;
  mask: string;
  value: string;
  start: number;
  end: number;
}

export interface Config {
  SCAN_INTERVAL_MS: number;
  FADE_DELAY_MS: number;
  MAX_PROMPT_LENGTH: number;
  MAX_DETECTIONS_PREVIEW: number;
  DEBOUNCE_MS: number;
  TOAST_ID: string;
  SUGGESTIONS_ID: string;
  HINT_ID: string;
  QUICKBAR_ID: string;
}

export interface State {
  toastEl: HTMLElement | null;
  suggestionsEl: HTMLElement | null;
  hintEl: HTMLElement | null;
  quickbarEl: HTMLElement | null;
  lastText: string;
  lastTextHash: number;
  detections: Detection[];
  isSubtle: boolean;
  fadeTimeout: ReturnType<typeof setTimeout> | null;
  inputRef: WeakRef<HTMLElement> | null;
  observer: MutationObserver | null;
  scanIntervalId: ReturnType<typeof setInterval> | null;
  abortController: AbortController | null;
}

export interface ElementAttrs {
  id?: string;
  className?: string;
  role?: string;
  tabindex?: string;
  textContent?: string;
  innerHTML?: string;
  title?: string;
  dataset?: Record<string, string>;
  [key: string]: string | Record<string, string> | undefined;
}

declare global {
  interface Window {
    __LLM_PURIFY_LOADED__?: boolean;
    __LLM_PURIFY_CLEANUP__?: () => void;
  }
}
