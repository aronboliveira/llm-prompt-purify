import { Component } from "@angular/core";
import Swal from "sweetalert2";
import { FormsModule } from "@angular/forms";
import { OutputBuilder } from "../libs/builders/OutputBuilder";
import { MAIN_DICT, PATTERNS } from "../libs/vars/dictionaries";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { appState } from "../libs/state";
import { CompressPickerComponent } from "./compress-picker/compress-picker.component";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CompressPickerComponent,
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
      results = [],
      outpId = "resultOutput",
      patternsTitle = "patternsTitle";
    let processing = true,
      failed = false,
      running = performance.now();
    const outp = document.getElementById(outpId);
    if (outp) outp.innerText = "";
    document.getElementById(patternsTitle)?.remove();
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
      const h3 = document.createElement("h3");
      h3.id = patternsTitle;
      h3.textContent = "Identified patterns and suggested masks";
      const outp = document.getElementById(outpId);
      if (outp) {
        outp.insertAdjacentElement("beforebegin", h3);
        outp.innerText = `${results
          .map(({ k, v }) => {
            let newWord = v,
              acc = 0;
            do {
              if (acc > v.length * 10) break;
              const evals = [];
              for (let l = 0; l < v.length; l++) {
                const d = v[l];
                if (
                  PATTERNS.SYMBOLS().test(d) &&
                  !/@\/\.\u20A0-\u20CF/.test(d)
                ) {
                  evals.push("s");
                  continue;
                } else if (PATTERNS.LATINIZED_CHARS().test(d)) {
                  evals.push("l");
                  continue;
                } else if (PATTERNS.NUMBERS().test(d)) {
                  evals.push("d");
                  continue;
                } else if (PATTERNS.JAPANESE().test(d)) {
                  evals.push("j");
                  continue;
                } else if (PATTERNS.HANGUL().test(d)) {
                  evals.push("hg");
                  continue;
                } else if (PATTERNS.HAN().test(d)) {
                  evals.push("ha");
                  continue;
                } else if (PATTERNS.ARABIC().test(d)) {
                  evals.push("a");
                  continue;
                } else if (PATTERNS.CYRILIC().test(d)) {
                  evals.push("c");
                  continue;
                } else evals.push("?");
              }
              newWord = "";
              const newLetters = [];
              for (let e = 0; e < evals.length; e++) {
                const c = evals[e];
                switch (c) {
                  case "s":
                    newLetters.push(PATTERNS.getRandomSymbol(v));
                    break;
                  case "l":
                    newLetters.push(
                      PATTERNS.getRandomChar(0x0041, 0x005a)
                        .concat(PATTERNS.getRandomChar(0x0061, 0x007a))
                        .concat(PATTERNS.getRandomChar(0x00c0, 0x00ff))[
                        Math.floor(Math.random() * 3)
                      ]
                    );
                    break;
                  case "d":
                    newLetters.push(Math.floor(Math.random() * 10));
                    break;
                  case "j":
                    newLetters.push(PATTERNS.getRandomChar(0x3040, 0x309f));
                    break;
                  case "hg":
                    newLetters.push(PATTERNS.getRandomChar(0xac00, 0xd7af));
                    break;
                  case "ha":
                    newLetters.push(
                      Math.random() < 0.5
                        ? PATTERNS.getRandomChar(0x4e00, 0x9fff)
                        : PATTERNS.getRandomChar(0x3400, 0x4dbf)
                    );
                    break;
                  case "a": {
                    newLetters.push(
                      Math.random() < 0.6
                        ? PATTERNS.getRandomChar(0x0600, 0x06ff)
                        : Math.random() < 0.8
                        ? PATTERNS.getRandomChar(0x0750, 0x077f)
                        : PATTERNS.getRandomChar(0x08a0, 0x08ff)
                    );
                    break;
                  }
                  case "c":
                    newLetters.push(PATTERNS.getRandomChar(0x0400, 0x04ff));
                    break;
                  default:
                    newLetters.push(v[e]);
                }
              }
              newWord = newLetters.join("");
              acc += 1;
            } while (newWord === v);
            if (/(?:cpf|cpnj|celular|telefone|rg)[\s\t\n=:]*/gi.test(newWord)) {
              const chars = newWord.split("");
              for (let a = 0; a < chars.length; a++) {
                if (PATTERNS.NUMBERS().test(chars[a]))
                  chars[a] = PATTERNS.getRandomSymbol(newWord);
              }
            }
            if (newWord.length < v.length)
              newWord = crypto
                .randomUUID()
                .slice(0, v.length - newWord.length)
                .replace(/@\/\.\u20A0-\u20CF/g, "a");
            return `${k
              .replace(/^[,_=]+/, "")
              .replace(/[,_=]+$/, "")
              .toUpperCase()}: ${v} — Suggested Mask: ${newWord}\n\n`;
          })
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
      _compressionLevel: appState.compressionLevel.toString(),
    });
  }
}
