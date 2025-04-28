import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
@Component({
  selector: "app-prompt-table",
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: "./prompt-table.component.html",
  styleUrls: [
    "./prompt-table.component.scss",
    "../styles/utils/margin.scss",
    "../styles/utils/padding.scss",
    "../styles/utils/text.scss",
  ],
})
export class PromptTableComponent {
  constructor(
    public dialogRef: MatDialogRef<PromptTableComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { text: string }
  ) {}
}
