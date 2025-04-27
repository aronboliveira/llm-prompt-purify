import { Component, EventEmitter, Output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
@Component({
  selector: "app-scan-submit",
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: "./scan-submit.component.html",
  styleUrl: "./scan-submit.component.scss",
})
export class ScanSubmitComponent {
  @Output() scan = new EventEmitter<void>();
}
