import { appState } from "../../../state";

export default class TableExecutive {
  #table: HTMLElement;
  constructor(_table: HTMLElement) {
    this.#table = _table;
  }
  get table(): HTMLElement {
    return this.#table;
  }
  set table(newTable: HTMLElement) {
    if (
      typeof window === "undefined" ||
      ((document.querySelector(this.#table.id) ||
        document.querySelector(this.#table.className.replace(/\s+/g, "."))) &&
        this.#table.isConnected)
    )
      return;
    else this.#table = newTable;
  }
  toggleAllChecks(state: boolean = false): void {
    if (
      !(
        this.#table?.isConnected &&
        this.#table.querySelector('input[type="checkbox"]')
      )
    )
      return;
    this.#table.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      if (!(chk instanceof HTMLInputElement && chk.type === "checkbox")) return;
      chk.checked = state;
      chk.dispatchEvent(
        new Event(appState.uncheckMaskEvent, {
          bubbles: true,
          cancelable: true,
        })
      );
    });
  }
  dispatchAllRegenerates(): void {
    if (
      !(
        this.#table?.isConnected && this.#table.querySelector(".regenerate-btn")
      )
    )
      return;
    this.#table.querySelectorAll(".regenerate-btn").forEach(b => {
      b.dispatchEvent(
        new MouseEvent(appState.regenerateEvent, {
          bubbles: true,
          cancelable: true,
        })
      );
    });
  }
}
