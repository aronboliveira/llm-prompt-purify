import { Component } from "@angular/core";
import Swal from "sweetalert2";
import { FormsModule } from "@angular/forms";
import { OutputBuilder } from "../libs/builders/OutputBuilder";
import { MAIN_DICT } from "../libs/vars/dictionaries";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
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
  checkPrompt(): void {
    let timerInterval: any;
    const txt = this.userInput.trim().split(/[\s\n\t\r=,_]/g),
      dictEntries = Object.entries(MAIN_DICT).filter(Boolean),
      results = [];
    let processing = true,
      failed = false,
      running = performance.now();
    const outp = document.getElementById("resultOutput");
    if (outp) outp.innerText = "";
    const loading = setInterval(() => {
      if (!processing) return;
      Swal.fire({
        title: "Processando o texto...",
        html: "Verificando se há tokens a serem mascarados...",
        timer: 2000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
          const timer = Swal.getPopup()?.querySelector("b");
          timerInterval = setInterval(() => {
            if (timer) timer.textContent = `${Swal.getTimerLeft()}`;
          }, 100);
        },
        willClose: () => {
          clearInterval(timerInterval);
        },
      });
      running += performance.now();
    }, 2000);
    setTimeout(() => {
      clearInterval(loading);
      if (processing) {
        failed = true;
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Timeout reached! Try again later!",
        });
      }
    }, 60_000);
    for (let w = 0; w < txt.length; w++) {
      if (failed) continue;
      for (let i = 0; i < dictEntries.length; i++) {
        const localDicts = dictEntries[i];
        for (let j = 0; j < Object.values(localDicts).length; j++) {
          const exps = Object.entries(localDicts[1]);
          for (let k = 0; k < exps.length; k++) {
            const exp = exps[k][1],
              key = exps[k][0];
            console.log([exp, key]);
            if (exp instanceof RegExp && exp.test(txt[w]))
              results.push({ k: key, e: exp, v: txt[w] });
            else if (
              typeof exp === "string" &&
              txt[w].trim().toLowerCase() === exp
            )
              results.push({ k: key, e: exp, v: txt[w] });
            if (k === exps.length - 1) processing = false;
          }
        }
      }
    }
    console.log(results);
    if (processing) return;
    if (!results.length)
      Swal.fire({
        title: "Your prompt is safe!",
        icon: "success",
        draggable: true,
      });
    else {
      Swal.fire({
        title: "Your prompt has dangerous data!",
        text: "You need to mask it!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, I will do it!",
      });
      const outp = document.getElementById("resultOutput");
      if (outp) {
        outp.innerText = `${results
          .map(
            ({ k, v }) =>
              `${k}: ${v} — Suggested Mask: ${crypto.randomUUID()}\n\n`
          )
          .toString()
          .replace("[", "")
          .replace("]", "")}`;
      }
    }
  }
  copyOutput(): void {
    navigator.clipboard
      .writeText(this.processInput(this.userInput))
      .then(() => {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Your text has been copied to the clipboard",
          showConfirmButton: false,
          timer: 1500,
        });
      });
  }
  downloadZip(): void {
    new OutputBuilder({
      _input: this.userInput,
      _compressionLevel: "6", //TODO INCLUIR OPÇÃO EM SELECT
    });
  }
}
