import { Component, EventEmitter, Input, Output } from "@angular/core";
@Component({
  selector: "app-custom-textarea",
  templateUrl: "./custom-textarea.component.html",
  styleUrls: ["./custom-textarea.component.scss"],
})
export class CustomTextAreaComponent {
  @Input() label: string = "";
  @Input() placeholder: string = "";
  @Input() value: string = "";
  @Input() errorMessage: string = "";
  @Input() required: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
  onInputChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.valueChange.emit(target.value);
  }
}
