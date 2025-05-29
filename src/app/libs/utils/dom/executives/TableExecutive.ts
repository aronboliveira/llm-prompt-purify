import { appState } from "../../../state";

export default class TableExecutive {
  #table: HTMLElement;
  constructor(_table: HTMLElement) {
    this.#table = _table;
  }
  get table(): HTMLElement {
    return this.#table;
  }
  setTable(newTable: HTMLElement | null) {
    if (
      typeof window === "undefined" ||
      !newTable ||
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
  dispatchAllRegenerates(ev: MouseEvent | PointerEvent): void {
    if (
      !(
        this.#table?.isConnected && this.#table.querySelector(".regenerate-btn")
      ) ||
      ev.button !== 0
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
  sortColumn(ev: MouseEvent | PointerEvent): void {
    const queryForRelCell = (): HTMLElement | null => {
      if (!(ev.currentTarget instanceof HTMLElement)) return null;
      return (
        ev.currentTarget.closest("th") ||
        ev.currentTarget.closest("td") ||
        ev.currentTarget.closest(".mat-mdc-header-cell")
      );
    };
    if (
      !(
        ev.button === 0 &&
        ev.currentTarget instanceof HTMLElement &&
        ev.currentTarget.isConnected &&
        queryForRelCell()
      )
    )
      return;
    const cell = queryForRelCell();
    if (!this.table?.isConnected)
      this.setTable(document.getElementById(appState.ids.scanTab));
    const firstRow = this.table.querySelector("tr");
    if (!this.table || !firstRow || !cell) return;
    new Set([
      ...Array.from(firstRow.querySelectorAll("th")),
      ...Array.from(firstRow.querySelectorAll("td")),
      ...Array.from(firstRow.querySelectorAll(".mat-mdc-header-cell")),
    ]).forEach(h => {
      h.setAttribute(appState.patterns.activeSorting, "false");
      h.removeAttribute(appState.patterns.order);
    });
    cell.setAttribute(appState.patterns.activeSorting, "true");
    const orderBy = cell.getAttribute(appState.patterns.order);
    cell.setAttribute(
      appState.patterns.order,
      !orderBy ? "asc" : orderBy === "asc" ? "desc" : "asc"
    );
  }
}
