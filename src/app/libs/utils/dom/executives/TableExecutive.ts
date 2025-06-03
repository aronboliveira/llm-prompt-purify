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
  sortColumn(ev: MouseEvent | PointerEvent): {
    all: Element[];
    targets: Element[];
    prevOrders: Record<string, string>;
  } | null {
    try {
      const queryForRelCell = (): HTMLElement | null => {
        if (!(ev.currentTarget instanceof HTMLElement)) return null;
        return (
          ev.currentTarget.closest("th") ??
          ev.currentTarget.closest("td") ??
          ev.currentTarget.closest(`.${appState.classes.matTh}`)
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
        return null;
      const cell = queryForRelCell();
      if (!this.table?.isConnected)
        this.setTable(document.getElementById(appState.ids.scanTab));
      const firstRow = this.table?.querySelector("tr");
      if (!this.table || !firstRow || !cell) return null;
      const prevOrders: Record<string, string> = {};
      let idxAcc = 0;
      const headerCells = new Set<HTMLElement>([
        ...Array.from(firstRow.getElementsByTagName("th")),
        ...Array.from(firstRow.getElementsByTagName("td")),
        ...(Array.from(
          firstRow.getElementsByClassName(appState.classes.matTh)
        ) as any as HTMLElement[]),
      ]);
      const prevTargOrder = cell.getAttribute(appState.patterns.order),
        prevActive = cell.getAttribute(appState.patterns.activeSorting);
      headerCells.forEach(h => {
        idxAcc += 1;
        h.setAttribute(appState.patterns.activeSorting, "false");
        h.setAttribute(appState.patterns.order, "asc");
        prevOrders[idxAcc.toString()] = "asc";
      });
      cell.setAttribute(appState.patterns.activeSorting, "true");
      prevTargOrder &&
        cell.setAttribute(
          appState.patterns.order,
          prevTargOrder === "asc" && prevActive === "true" ? "desc" : "asc"
        );
      const res = this.#getTargets(cell);
      console.log(res);
      return res ? { ...res, prevOrders } : null;
    } catch (e) {
      console.error(
        `Error sorting table: ${(e as Error).name} — ${(e as Error).message}`
      );
      return null;
    }
  }
  #getTargets(
    targCell: HTMLElement
  ): { all: Element[]; targets: Element[] } | null {
    const pt = appState.patterns;
    let targCellIdx = targCell.getAttribute(pt.col);
    if (!targCellIdx) {
      const targTr =
        targCell.closest("tr") ??
        targCell.closest(`.${appState.classes.matTr}`) ??
        targCell.closest(`.${appState.classes.matTrAlt}`);
      if (!targTr) return null;
      const headerSet = Array.from(
        new Set<HTMLElement>([
          ...Array.from(targTr.getElementsByTagName("th")),
          ...(Array.from(
            targTr.getElementsByClassName(appState.classes.matTh)
          ) as any as HTMLElement[]),
        ])
      );
      for (let i = 0; i < headerSet.length; i++) {
        if (headerSet[i] === targCell) targCellIdx = (i + 1).toString();
        break;
      }
      if (!targCellIdx) return null;
    }
    const allCells: Element[] = Array.from(
      new Set(
        [
          ...Array.from(this.table.getElementsByTagName("td")),
          ...(Array.from(
            this.table.getElementsByClassName(appState.classes.matTd)
          ) as any as Element[]),
        ].filter(
          c => c instanceof HTMLElement && !c.getAttribute(pt.activeSorting)
        )
      )
    );
    const targCells: Element[] = [];
    for (const c of allCells) {
      if (!(c instanceof HTMLElement)) continue;
      const thisCol = c.getAttribute(pt.col);
      if (!thisCol) continue;
      const refHdId = c.getAttribute(pt.refHead),
        fallbackRelTh = (): HTMLElement | null => {
          return Array.from(
            this.table.getElementsByClassName(appState.classes.matTh)
          ).find(
            h => (h as HTMLElement).getAttribute(pt.col) === thisCol
          ) as HTMLElement | null;
        },
        linkedHeader: HTMLElement | null | undefined = refHdId
          ? (() => {
              const thRef = document.getElementById(refHdId);
              return thRef && thRef.id.endsWith(thisCol)
                ? thRef
                : fallbackRelTh();
            })()
          : fallbackRelTh();
      console.log("This col ", thisCol);
      console.log(linkedHeader);
      console.log(
        "Active sorting ",
        linkedHeader?.getAttribute(pt.activeSorting) || "NULL"
      );
      linkedHeader instanceof HTMLElement &&
        linkedHeader.getAttribute(pt.activeSorting) === "true" &&
        targCells.push(c);
    }
    return { all: allCells, targets: targCells };
  }
}
