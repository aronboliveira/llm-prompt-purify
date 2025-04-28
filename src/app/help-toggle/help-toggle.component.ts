import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { InfoDialogService } from "../libs/state/info-dialog-service";
@Component({
  selector: "app-help-toggle",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: "./help-toggle.component.html",
  styleUrl: "./help-toggle.component.scss",
})
export class HelpToggleComponent {
  isHelpOpen = false;
  constructor(private _infoDialogService: InfoDialogService) {
    this._infoDialogService.isHelpOpen$.subscribe((isOpen: boolean) => {
      this.isHelpOpen = isOpen;
    });
  }
  onToggleHelp(): void {
    this._infoDialogService.toggleHelp();
  }
}
