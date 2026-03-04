import { DOCUMENT } from "@angular/common";
import { inject, Injectable, signal } from "@angular/core";

import { THEME_STORAGE_KEY } from "./constants/theme.constants";
import type { ThemeMode } from "./declarations/theme.types";

export type { ThemeMode } from "./declarations/theme.types";

/**
 * S-005: Theme service for dark mode support.
 * Respects system preference by default, allows manual override.
 */
@Injectable({ providedIn: "root" })
export class ThemeService {
  readonly #document = inject(DOCUMENT);
  readonly #currentTheme = signal<ThemeMode>("system");

  readonly theme = this.#currentTheme.asReadonly();

  constructor() {
    this.#initializeTheme();
  }

  setTheme(mode: ThemeMode): void {
    this.#currentTheme.set(mode);
    this.#applyTheme(mode);
    this.#persistTheme(mode);
  }

  toggle(): void {
    const current = this.#currentTheme();
    const next: ThemeMode =
      current === "light" ? "dark" : current === "dark" ? "system" : "light";
    this.setTheme(next);
  }

  isDark(): boolean {
    const mode = this.#currentTheme();
    if (mode === "system") {
      return this.#prefersDark();
    }
    return mode === "dark";
  }

  #initializeTheme(): void {
    const stored = this.#getStoredTheme();
    if (stored) {
      this.#currentTheme.set(stored);
      this.#applyTheme(stored);
    }
  }

  #applyTheme(mode: ThemeMode): void {
    const root = this.#document.documentElement;

    if (mode === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", mode);
    }
  }

  #persistTheme(mode: ThemeMode): void {
    try {
      if (mode === "system") {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      }
    } catch {
      // localStorage unavailable (SSR, private browsing)
    }
  }

  #getStoredTheme(): ThemeMode | null {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch {
      // localStorage unavailable
    }
    return null;
  }

  #prefersDark(): boolean {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
}
