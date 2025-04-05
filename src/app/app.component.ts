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
import { ScanSubmitComponent } from "./app-scan-submit/scan-submit.component";
import { UserInputSerivce } from "./libs/state/user-input.service";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ScanSubmitComponent,
    CompressPickerComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  constructor(private _userInputService: UserInputSerivce) {}
  userInput = "";
  maxLength = 4096;
  processedOutput = "";
  ngOnInit(): void {
    this.processedOutput = this.userInput.trim();
  }
  setInput(v: string) {
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
}
