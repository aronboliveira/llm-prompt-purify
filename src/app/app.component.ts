import { Component } from "@angular/core";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { FormsModule } from "@angular/forms";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  maxLength = 4096;
  userInput = "";
  processedOutput = "";
  ngOnInit(): void {
    this.processedOutput = this.processInput(this.userInput);
  }
  processInput(text: string): string {
    return text.trim();
  }
  copyOutput(): void {
    navigator.clipboard
      .writeText(this.processInput(this.userInput))
      .then(() => {
        alert("Output copied to clipboard!");
      });
  }
  downloadZip(): void {
    const zip = new JSZip();
    zip.file("sensitive-output.txt", this.processInput(this.userInput));
    zip
      .generateAsync({ type: "blob", compression: "DEFLATE" })
      .then((content) => saveAs(content, "output.zip"));
  }
}
