import { Component, EventEmitter, Input, Output } from "@angular/core";
@Component({
  selector: "app-custom-input",
  templateUrl: "./custom-input.component.html",
  styleUrls: ["./custom-input.component.scss"],
})
export class CustomInputComponent {
  @Input() label: string = "";
  @Input() placeholder: string = "";
  @Input() value: string = "";
  @Input() errorMessage: string = "";
  @Input() required: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }
}
