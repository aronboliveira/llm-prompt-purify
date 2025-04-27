import { Component } from "@angular/core";
@Component({
  selector: "app-contact-form",
  templateUrl: "./contact-form.component.html",
  styleUrls: ["./contact-form.component.scss"],
  imports: [],
  standalone: true,
})
export class ContactFormComponent {
  name: string = "";
  email: string = "";
  subject: string = "";
  message: string = "";
  nameError: string = "";
  emailError: string = "";
  subjectError: string = "";
  messageError: string = "";
  onSubmit(): void {
    // todo: add validation logic
    alert("Contact submitted!");
  }
}
