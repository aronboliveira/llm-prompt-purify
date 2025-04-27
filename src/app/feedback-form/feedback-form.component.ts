import { Component } from "@angular/core";
@Component({
  selector: "app-feedback-form",
  templateUrl: "./feedback-form.component.html",
  styleUrls: ["./feedback-form.component.scss"],
  standalone: true,
  imports: [],
})
export class FeedbackFormComponent {
  name: string = "";
  email: string = "";
  feedback: string = "";
  nameError: string = "";
  emailError: string = "";
  feedbackError: string = "";
  onSubmit(): void {
    // todo: add validation logic
    alert("Feedback submitted!");
  }
}
