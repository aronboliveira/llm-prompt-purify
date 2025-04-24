import { Component } from "@angular/core";
import Swal from "sweetalert2";
import { FormsModule } from "@angular/forms";
import { OutputBuilder } from "./libs/builders/OutputBuilder";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { appState } from "./libs/state";
import { CompressPickerComponent } from "./compress-picker/compress-picker.component";
import { ScanSubmitComponent } from "./scan-submit/scan-submit.component";
import { UserInputSerivce } from "./libs/state/user-input.service";
import { UnderDevelopmentComponent } from "./under-development/under-development.component";
import { HelpToggleComponent } from "./help-toggle/help-toggle.component";
import { InfoModalComponent } from "./info-modal/info-modal.component";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { presentation } from "./libs/bloc/html/info";
import { FixedHeaderComponent } from "./fixed-header/fixed-header.component";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    FixedHeaderComponent,
    HelpToggleComponent,
    InfoModalComponent,
    ScanSubmitComponent,
    CompressPickerComponent,
    UnderDevelopmentComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  constructor(
    private _userInputService: UserInputSerivce,
    public dialog: MatDialog
  ) {}
  userInput = "";
  processedOutput = "";
  maxLength = 4096;
  isHelpOpen = false;
  ngOnInit(): void {
    this.processedOutput = this.userInput.trim();
  }
  setInput(v: string): void {
    this.userInput = v;
    this._userInputService.setObsUserInput(v);
  }
  copyOutput(): void {
    navigator.clipboard.writeText(this.userInput.trim()).then(() => {
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Your text has been copied to the clipboard",
        showConfirmButton: false,
        timer: 1500,
      });
    });
  }
  downloadZip(): void {
    new OutputBuilder({
      _input: this.userInput,
      _compressionLevel: appState.compressionLevel.toString(),
    });
  }
  openInfoDialog(): void {
    this.dialog
      .open(InfoModalComponent, {
        data: { text: presentation() },
        panelClass: "project-info-modal",
      })
      .afterClosed()
      .subscribe(() => {
        this.isHelpOpen = false;
      });
  }
}
