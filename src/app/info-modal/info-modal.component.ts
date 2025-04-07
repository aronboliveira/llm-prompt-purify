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
  selector: "app-info-modal",
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: "./info-modal.component.html",
  styleUrls: [
    "./info-modal.component.scss",
    "../styles/utils/margin.scss",
    "../styles/utils/padding.scss",
    "../styles/utils/text.scss",
  ],
})
export class InfoModalComponent {
  constructor(
    public dialogRef: MatDialogRef<InfoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { text: string }
  ) {}
}
