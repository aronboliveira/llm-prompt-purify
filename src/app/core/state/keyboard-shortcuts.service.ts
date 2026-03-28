import { DOCUMENT } from "@angular/common";
import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs/operators";
import { fromEvent } from "rxjs";

import type { KeyboardShortcut } from "./declarations/keyboard-shortcuts.types";

export type { KeyboardShortcut } from "./declarations/keyboard-shortcuts.types";

/**
 * S-004: Global keyboard shortcuts service for power users.
 * - Ctrl+Shift+C: Copy masked text
 * - Escape: Close any open modal
 * - Ctrl+Z: Undo (if undo service available)
 * - Ctrl+Shift+Y: Redo (if undo service available)
 */
@Injectable({ providedIn: "root" })
export class KeyboardShortcutsService {
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly #shortcuts = signal<KeyboardShortcut[]>([]);

  readonly shortcuts = this.#shortcuts.asReadonly();

  constructor() {
    fromEvent<KeyboardEvent>(this.#document, "keydown")
      .pipe(
        filter(event => !this.#isInputFocused(event)),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe(event => this.#handleKeydown(event));
  }

  register(shortcut: KeyboardShortcut): void {
    this.#shortcuts.update(list => [...list, shortcut]);
  }

  unregister(key: string): void {
    this.#shortcuts.update(list => list.filter(s => s.key !== key));
  }

  #handleKeydown(event: KeyboardEvent): void {
    for (const shortcut of this.#shortcuts()) {
      if (this.#matchesShortcut(event, shortcut)) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }

  #matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase(),
      ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey),
      shiftMatch = !!shortcut.shift === event.shiftKey,
      altMatch = !!shortcut.alt === event.altKey;

    return keyMatch && ctrlMatch && shiftMatch && altMatch;
  }

  #isInputFocused(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement,
      tagName = target.tagName?.toLowerCase();

    // Allow shortcuts even in inputs for Escape key
    if (event.key === "Escape") return false;

    return (
      tagName === "input" || tagName === "textarea" || target.isContentEditable
    );
  }
}
