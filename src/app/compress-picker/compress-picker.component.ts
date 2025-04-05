import { Component } from "@angular/core";
import { appState } from "../libs/state";
import { FormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatOptionModule } from "@angular/material/core";
import { CommonModule } from "@angular/common";
@Component({
  selector: "app-compress-picker",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
  ],
  templateUrl: "./compress-picker.component.html",
  styleUrl: "./compress-picker.component.scss",
})
export class CompressPickerComponent {
  compressionLevels = Array.from({ length: 9 }).map((_, i) => i + 1);
  compressionLevel = appState.compressionLevel;
  updateCompressionLevel(): void {
    if (
      typeof this.compressionLevel !== "number" ||
      !Number.isFinite(this.compressionLevel)
    )
      this.compressionLevel = 1;
    this.compressionLevel = Math.round(this.compressionLevel);
    this.compressionLevel = Math.max(1, Math.min(9, this.compressionLevel));
    appState.compressionLevel = this.compressionLevel;
    console.log("Selected level " + this.compressionLevel);
  }
}
