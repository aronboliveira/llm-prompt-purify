import { Component, EventEmitter, Output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
@Component({
  selector: "app-scan-submit",
  standalone: true,
  imports: [MatButtonModule, MatTooltipModule],
  templateUrl: "./scan-submit.component.html",
  styleUrl: "./scan-submit.component.scss",
})
export class ScanSubmitComponent {
  @Output() scan = new EventEmitter<void>();
}
