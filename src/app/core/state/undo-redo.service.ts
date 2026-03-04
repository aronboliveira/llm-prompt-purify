import { DestroyRef, Injectable, inject, signal } from "@angular/core";
import { KeyboardShortcutsService } from "./keyboard-shortcuts.service";

/**
 * S-001: Undo/Redo service for mask toggle state changes.
 * Maintains a history stack with configurable max size.
 * Integrates with keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y (redo)
 */
@Injectable({ providedIn: "root" })
export class UndoRedoService<T> {
  readonly #keyboard = inject(KeyboardShortcutsService);

  readonly #undoStack = signal<T[]>([]);
  readonly #redoStack = signal<T[]>([]);
  readonly #maxStackSize = 50;

  readonly canUndo = () => this.#undoStack().length > 0;
  readonly canRedo = () => this.#redoStack().length > 0;
  readonly undoStackSize = () => this.#undoStack().length;
  readonly redoStackSize = () => this.#redoStack().length;

  #onRestoreCallback?: (state: T) => void;

  constructor() {
    this.#keyboard.register({
      key: "z",
      ctrl: true,
      description: "Undo last mask change",
      action: () => this.undo(),
    });

    this.#keyboard.register({
      key: "y",
      ctrl: true,
      description: "Redo last undone change",
      action: () => this.redo(),
    });
  }

  /**
   * Register callback to restore state when undo/redo is triggered.
   */
  onRestore(callback: (state: T) => void): void {
    this.#onRestoreCallback = callback;
  }

  /**
   * Records the current state before a change.
   * Call this before modifying state to enable undo.
   */
  pushState(state: T): void {
    this.#undoStack.update(stack => {
      const newStack = [...stack, state];
      if (newStack.length > this.#maxStackSize) {
        return newStack.slice(newStack.length - this.#maxStackSize);
      }
      return newStack;
    });
    // Clear redo stack on new action
    this.#redoStack.set([]);
  }

  /**
   * Undo the last action, restoring previous state.
   */
  undo(): T | undefined {
    const stack = this.#undoStack();
    if (stack.length === 0) return undefined;

    const previousState = stack.at(-1)!;
    this.#undoStack.set(stack.slice(0, -1));
    this.#redoStack.update(redo => [...redo, previousState]);

    this.#onRestoreCallback?.(previousState);
    return previousState;
  }

  /**
   * Redo the last undone action.
   */
  redo(): T | undefined {
    const stack = this.#redoStack();
    if (stack.length === 0) return undefined;

    const nextState = stack.at(-1)!;
    this.#redoStack.set(stack.slice(0, -1));
    this.#undoStack.update(undo => [...undo, nextState]);

    this.#onRestoreCallback?.(nextState);
    return nextState;
  }

  /**
   * Clear all history.
   */
  clear(): void {
    this.#undoStack.set([]);
    this.#redoStack.set([]);
  }
}
