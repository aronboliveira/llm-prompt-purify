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
    this.#table.querySelectorAll(".mask-check-field").forEach(chk => {
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
        ev.currentTarget.closest(`${appState.classes.matTh}`)
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
      ...Array.from(firstRow.getElementsByTagName("th")),
      ...Array.from(firstRow.getElementsByTagName("td")),
      ...Array.from(firstRow.getElementsByClassName(appState.classes.matTh)),
    ]).forEach(h => {
      h.setAttribute(appState.patterns.activeSorting, "false");
      h !== cell && h.setAttribute(appState.patterns.order, "asc");
    });
    cell.setAttribute(appState.patterns.activeSorting, "true");
    this.#recollectAndSort(cell);
  }
  #recollectAndSort(targCell: HTMLElement) {
    const pt = appState.patterns;
    let targCellIdx = targCell.getAttribute(pt.col);
    if (!targCellIdx) {
      const targTr =
        targCell.closest("tr") ??
        targCell.closest(`.${appState.classes.matTr}`) ??
        targCell.closest(`.${appState.classes.matTrAlt}`);
      if (!targTr) return;
      const setCells = Array.from(
        new Set([
          ...Array.from(targTr.getElementsByTagName("th")),
          ...Array.from(targTr.getElementsByClassName(appState.classes.matTh)),
        ])
      );
      for (let i = 0; i <= setCells.length; i++) {
        const c = setCells[i];
        if (!(c instanceof HTMLElement)) return;
        if (c === targCell) {
          targCellIdx = (i + 1).toString();
          break;
        }
      }
    }
    // rows =
    //   this.#table instanceof HTMLTableElement
    //     ? Array.from(this.#table.rows)
    //     : Array.from(
    //         new Set([
    //           ...Array.from(this.#table.getElementsByTagName("tr")),
    //           ...Array.from(
    //             this.#table.querySelectorAll("[class*=mat-mdc-table-row]")
    //           ),
    //         ])
    //       ),
    // sortingHeader = Array.from(
    //   new Set([
    //     ...Array.from(rows[0].querySelectorAll("th")),
    //     ...Array.from(rows[0].querySelectorAll(".mat-mdc-header-cell")),
    //   ])
    // )
    //   .map<[number, Element]>((h, i) => [i, h])
    //   .find(
    //     ([_, h]) =>
    //       h instanceof HTMLElement &&
    //       h.getAttribute(pt.sort) &&
    //       h.getAttribute(pt.order) &&
    //       h.getAttribute(pt.activeSorting) === "true"
    //   );
    targCell.setAttribute(
      pt.order,
      targCell.getAttribute(pt.order) === "asc" ? "desc" : "asc"
    );
    let cells = Array.from(
      new Set(
        [
          ...Array.from(this.#table.getElementsByTagName("td")),
          ...Array.from(
            this.#table.getElementsByClassName(appState.classes.matTd)
          ),
        ].filter(
          c =>
            c instanceof HTMLElement &&
            c.getAttribute(pt.col) === targCellIdx &&
            !c.classList.contains(appState.classes.matTh)
        )
      )
    ).sort((a, b) => {
      const criteria = targCell.getAttribute(pt.sort) || "index",
        direction = targCell.getAttribute(pt.order) || "asc";
      let result = 0;
      if (criteria.toLowerCase().includes("pattern"))
        result = (a.textContent || (a as HTMLElement).innerText || "")
          .trim()
          .localeCompare(
            (b.textContent || (b as HTMLElement).innerText || "").trim(),
            ["pt", "de", "es", "hb", "in", "ja", "ko", "zh", "ru", "fr", "it"],
            {
              sensitivity: "base",
              numeric: false,
              caseFirst: "false",
              ignorePunctuation: false,
            }
          );
      else if (criteria.toLowerCase().includes("suggested")) {
        const getUnicodeValue = (str: string) => {
            return Array.from(str).map(char => char.codePointAt(0));
          },
          unicodeA = getUnicodeValue(
            (a.textContent || (a as HTMLElement).innerText || "").trim()
          ),
          unicodeB = getUnicodeValue(
            (b.textContent || (b as HTMLElement).innerText || "").trim()
          );
        for (let i = 0; i < Math.min(unicodeA.length, unicodeB.length); i++) {
          if (unicodeA[i] !== unicodeB[i]) {
            result = (unicodeA?.[i] || 0) - (unicodeB?.[i] || 0);
            break;
          }
        }
        if (result === 0) result = unicodeA.length - unicodeB.length;
      } else if (criteria.toLowerCase().includes("use_mask")) {
        const checkboxA = a.querySelector('input[type="checkbox"]'),
          checkboxB = b.querySelector('input[type="checkbox"]'),
          checkedA = checkboxA
            ? (checkboxA as HTMLInputElement).checked
            : false,
          checkedB = checkboxB
            ? (checkboxB as HTMLInputElement).checked
            : false;
        if (checkedA === checkedB)
          result = (a.textContent || (a as HTMLElement).innerText || "")
            .trim()
            .localeCompare(b.textContent || (b as HTMLElement).innerText || "");
        else result = Number(checkedB) - Number(checkedA);
      } else {
        const getNumericValue = (element: HTMLElement) => {
          const match = (element.textContent || element.innerText || "")
              .trim()
              .match(/-?\d+(\.\d+)?/),
            parsed = match ? parseFloat(match[0]) : 0;
          return !Number.isFinite(parsed) ? parsed : 0;
        };
        result =
          getNumericValue(a as HTMLElement) - getNumericValue(b as HTMLElement);
      }
      return direction.toLowerCase() === "desc" ? -result : result;
    });
    console.log(targCell.getAttribute("data-orderby"));
    if (targCell.getAttribute(pt.order) === "desc") {
      cells = cells.reverse();
      console.log(cells[0]);
    } else {
      console.log(cells[0]);
    }
  }
}
