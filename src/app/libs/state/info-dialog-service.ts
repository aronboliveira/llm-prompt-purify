import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { BehaviorSubject } from "rxjs";
import { InfoModalComponent } from "../../info-modal/info-modal.component";
import { presentation } from "../bloc/html/info";
@Injectable({ providedIn: "root" })
export class InfoDialogService {
  #isHelpOpen = new BehaviorSubject<boolean>(false);
  isHelpOpen$ = this.#isHelpOpen.asObservable();

  constructor(private _matDialog: MatDialog) {}

  openHelp(): void {
    if (!this.#isHelpOpen.value) {
      this._matDialog
        .open(InfoModalComponent, {
          data: { text: presentation() },
          panelClass: "project-info-modal",
        })
        .afterClosed()
        .subscribe(() => {
          this.#isHelpOpen.next(false);
        });

      this.#isHelpOpen.next(true);
    }
  }

  closeHelp(): void {
    if (this.#isHelpOpen.value) {
      this._matDialog.closeAll();
      this.#isHelpOpen.next(false);
    }
  }

  toggleHelp(): void {
    this.#isHelpOpen.value ? this.closeHelp() : this.openHelp();
  }

  get isHelpOpen(): boolean {
    return this.#isHelpOpen.value;
  }
}
