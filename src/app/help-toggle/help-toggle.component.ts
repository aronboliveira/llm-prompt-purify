import { CommonModule } from "@angular/common";
import { Component, OnDestroy } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { InfoDialogService } from "../libs/state/info-dialog-service";
import { Subject, takeUntil } from "rxjs";
@Component({
  selector: "app-help-toggle",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: "./help-toggle.component.html",
  styleUrl: "./help-toggle.component.scss",
})
export class HelpToggleComponent implements OnDestroy {
  isHelpOpen = false;
  private destroy$ = new Subject<void>();
  constructor(private _infoDialogService: InfoDialogService) {
    this._infoDialogService.isHelpOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isOpen: boolean) => {
        this.isHelpOpen = isOpen;
      });
  }
  onToggleHelp(): void {
    this._infoDialogService.toggleHelp();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
