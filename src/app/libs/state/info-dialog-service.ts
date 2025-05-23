import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { BehaviorSubject, takeUntil } from "rxjs";
import { InfoModalComponent } from "../../info-modal/info-modal.component";
import { presentation } from "../bloc/html/info";
import { PromptTableComponent } from "../../prompt-table/prompt-table.component";
import { DomSanitizer } from "@angular/platform-browser";
@Injectable({ providedIn: "root" })
export class InfoDialogService {
  #isHelpOpen = new BehaviorSubject<boolean>(false);
  isHelpOpen$ = this.#isHelpOpen.asObservable();
  #isPromptTableOpen = new BehaviorSubject<boolean>(false);
  isPromptTableOpen$ = this.#isPromptTableOpen.asObservable();
  constructor(
    private _matDialog: MatDialog,
    private _sanitizer: DomSanitizer
  ) {}
  openHelp(): void {
    if (this.#isHelpOpen.value) return;
    this._matDialog
      .open(InfoModalComponent, {
        data: { text: presentation() },
        panelClass: "project-info-modal",
      })
      .afterClosed()
      .subscribe(() => this.#isHelpOpen.next(false));
    this.#isHelpOpen.next(true);
  }
  openPromptTable(data?: any): void {
    if (this.#isPromptTableOpen.value) return;
    this._matDialog
      .open(PromptTableComponent, {
        data: {
          text: this._sanitizer.bypassSecurityTrustHtml(
            '<span class="subtitle">Check the definitions and features for your customization of the text</span><hr class="info-break info-break-secondary">'
          ),
          prompt: data?.prompt ?? "",
        },
        panelClass: "prompt-table-modal",
      })
      .afterClosed()
      .subscribe(() => this.#isPromptTableOpen.next(false));
  }
  closeHelp(): void {
    if (!this.#isHelpOpen.value) return;
    this._matDialog.closeAll();
    this.#isHelpOpen.next(false);
  }
  closePromptTable(): void {
    if (!this.#isPromptTableOpen.value) return;
    this._matDialog.closeAll();
    this.#isPromptTableOpen.next(false);
  }
  toggleHelp(): void {
    this.#isHelpOpen.value ? this.closeHelp() : this.openHelp();
  }
  togglePromptTable(data?: any): void {
    this.#isPromptTableOpen.value
      ? this.closePromptTable()
      : this.openPromptTable(data);
  }
  get isHelpOpen(): boolean {
    return this.#isHelpOpen.value;
  }
  get isPromptTableOpen(): boolean {
    return this.#isPromptTableOpen.value;
  }
}
