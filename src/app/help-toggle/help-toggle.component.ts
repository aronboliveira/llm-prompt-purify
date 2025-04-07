import { CommonModule } from "@angular/common";
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
@Component({
  selector: "app-help-toggle",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: "./help-toggle.component.html",
  styleUrl: "./help-toggle.component.scss",
})
export class HelpToggleComponent {
  @Input() isHelpOpen: boolean = false;
  @Output() toggleHelp: EventEmitter<void> = new EventEmitter();
  onToggle(): void {
    this.toggleHelp.emit();
  }
}
