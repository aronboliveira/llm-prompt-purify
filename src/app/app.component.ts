import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import Swal from "sweetalert2";
import { FormsModule } from "@angular/forms";
import { OutputBuilder } from "./libs/builders/OutputBuilder";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { appState } from "./libs/state";
import { CompressPickerComponent } from "./compress-picker/compress-picker.component";
import { ScanSubmitComponent } from "./scan-submit/scan-submit.component";
import { UserInputSerivce } from "./libs/state/user-input.service";
import { UnderDevelopmentComponent } from "./under-development/under-development.component";
import { HelpToggleComponent } from "./help-toggle/help-toggle.component";
import { InfoModalComponent } from "./info-modal/info-modal.component";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { presentation } from "./libs/bloc/html/info";
import { FixedHeaderComponent } from "./fixed-header/fixed-header.component";
import { MAIN_DICT, PATTERNS } from "./libs/vars/dictionaries";
import DOMValidator from "./libs/utils/dom/DOMValidator";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    FixedHeaderComponent,
    HelpToggleComponent,
    InfoModalComponent,
    ScanSubmitComponent,
    CompressPickerComponent,
    UnderDevelopmentComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("promptInput", { static: true }) input: ElementRef | null = null;
  userInput = "";
  processedOutput = "";
  isHelpOpen = false;
  _maxLength = 4096;
  promptValueKey = "llmPromptToPurifyValue";
  constructor(
    private _userInputService: UserInputSerivce,
    public dialog: MatDialog
  ) {}
  handleEnter(ev: KeyboardEvent): void {
    try {
      if (
        ev.key?.toLowerCase() !== "enter" ||
        document.body?.classList.contains("swal2-shown")
      )
        return;
      ev.preventDefault();
      const promptInput =
        this.input?.nativeElement ?? document.getElementById("promptInput");
      if (DOMValidator.isTextbox(promptInput)) {
        promptInput;
      }
      this.checkPrompt();
    } catch (e) {
      console.warn(`Failed to handle enter press`);
      console.warn(e);
    }
  }
  ngOnInit(): void {
    this.processedOutput = this.userInput.trim();
  }
  ngAfterViewInit(): void {
    if (typeof window === "undefined") return;
    const ppi =
      this.input?.nativeElement || document.getElementById("promptInput");
    if (ppi instanceof HTMLElement) {
      try {
        (async (): Promise<void> => {
          const ppjv = sessionStorage.getItem(this.promptValueKey);
          if (!ppjv) return;
          const ppv = JSON.parse(ppjv);
          if (!("v" in ppv)) return;
          await new Promise(resolve => setTimeout(resolve, 200));
          if (DOMValidator.isDefaultTextbox(ppi)) ppi.value = ppv.v;
          else if (DOMValidator.isCustomCheckbox(ppi)) ppi.innerText = ppv.v;
          if (
            ppi instanceof HTMLElement &&
            ppi.getAttribute("data-focused") !== "true" &&
            ((DOMValidator.isDefaultTextbox(ppi) && ppi.value === "") ||
              (DOMValidator.isCustomCheckbox(ppi) && ppi.innerText === ""))
          ) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (DOMValidator.isDefaultTextbox(ppi)) ppi.value = ppv.v;
            else if (DOMValidator.isCustomCheckbox(ppi)) ppi.innerText = ppv.v;
          }
        })();
      } catch (sse) {
        console.error(`Failed to get prompt value from session storage`);
      }
      if (ppi?.dataset?.["focusenter"] !== "true") {
        ppi.addEventListener("focus", ev => {
          if (
            !(
              ev.currentTarget instanceof HTMLElement &&
              ev.currentTarget.isConnected
            )
          )
            return;
          ppi.setAttribute("data-focused", "true");
        });
        ppi.addEventListener("blur", ev => {
          if (
            !(
              ev.currentTarget instanceof HTMLElement &&
              ev.currentTarget.isConnected
            )
          )
            return;
          ppi?.setAttribute("data-focused", "false");
        });
        window.addEventListener("keyup", this.handleEnter.bind(this));
        ppi.dataset["focusenter"] = "true";
      }
    }
  }
  ngOnDestroy(): void {
    if (typeof window === "undefined") return;
    window.removeEventListener("keyup", this.handleEnter);
  }
  setInput(v: string): void {
    this.userInput = v;
    this._userInputService.setObsUserInput(v);
    try {
      window &&
        sessionStorage.setItem(
          this.promptValueKey,
          JSON.stringify({ v: v.toString() })
        );
    } catch (e) {}
  }
  copyOutput(): void {
    navigator.clipboard.writeText(this.userInput.trim()).then(() => {
      Swal.fire({
        toast: true,
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
  openInfoDialog(): void {
    this.dialog
      .open(InfoModalComponent, {
        data: { text: presentation() },
        panelClass: "project-info-modal",
      })
      .afterClosed()
      .subscribe(() => {
        this.isHelpOpen = false;
      });
  }
  async checkPrompt(): Promise<void> {
    let timerInterval: any,
      loadingId: any,
      failed = false,
      empty = false;
    const txt = (this.userInput || "")
        ?.trim()
        .split(/[\s\n\t\r=,_]+/g)
        .filter(Boolean),
      dictEntries = Object.entries(MAIN_DICT).filter(Boolean),
      results: Array<{ k: string; e: RegExp | string; v: string }> = [],
      outpId = "resultOutput",
      patternsTitle = "patternsTitle",
      outp = document.getElementById(outpId),
      limit = 60_000,
      mountTable = (targ: Element | null): void => {
        if (!targ) {
          console.warn(`The masking suggestions could not be mounted due to a falsish target for adjacent insertion:
          Target: ${(targ as any)?.toString()}`);
          return;
        }
        const tb = document.createElement("table"),
          th = document.createElement("thead"),
          tbd = document.createElement("tbody"),
          headers = [
            { e: document.createElement("th"), txt: "Index" },
            {
              e: document.createElement("th"),
              txt: "Pattern Recognized",
            },
            { e: document.createElement("th"), txt: "Suggested Mask" },
          ],
          cap = document.createElement("caption");
        tb.id = `scanResults`;
        cap.id = `captionScanResults`;
        cap.innerText = "Relation of patterns and suggested masks";
        for (const { k, v } of [
          { k: "fontSize", v: "0.8rem" },
          { k: "opacity", v: "0.7" },
          { k: "fontStyle", v: "italic" },
          { k: "textAlign", v: "center" },
          { k: "verticalAlign", v: "baseline" },
          { k: "paddingBottom", v: "1rem" },
        ]) {
          try {
            const dc = Object.getOwnPropertyDescriptor(cap.style, k);
            if (dc?.writable && !["length", "parentRule"].includes(k)) {
              cap.style.setProperty(
                k
                  .replace(
                    /([a-záàâäãéèêëíìîïóòôöõúùûüçñ0-9])([A-ZÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÇ])/g,
                    "$1-$2"
                  )
                  .toLowerCase(),
                v
              );
            }
          } catch (se) {
            console.log(se);
            continue;
          }
        }
        tb.appendChild(cap);
        targ.insertAdjacentElement("afterend", tb);
        tb.appendChild(th);
        th.insertRow();
        headers.forEach(h => {
          th.rows[0].appendChild(h.e);
          h.e.style.fontWeight = "bold";
          h.e.innerText = h.txt;
        });
        tb.appendChild(tbd);
        results.forEach(({ k, v }, i) => {
          let newWord = v;
          let acc = 0;
          do {
            if (acc > v.length * 10) break;
            const evals = [];
            for (let l = 0; l < v.length; l++) {
              const d = v[l];
              if (
                PATTERNS.SYMBOLS().test(d) &&
                !/[@\/.\u20A0-\u20CF]/.test(d)
              ) {
                evals.push("s");
              } else if (PATTERNS.LATINIZED_CHARS().test(d)) {
                evals.push("l");
              } else if (PATTERNS.NUMBERS().test(d)) {
                evals.push("d");
              } else if (PATTERNS.JAPANESE().test(d)) {
                evals.push("j");
              } else if (PATTERNS.HANGUL().test(d)) {
                evals.push("hg");
              } else if (PATTERNS.HAN().test(d)) {
                evals.push("ha");
              } else if (PATTERNS.ARABIC().test(d)) {
                evals.push("a");
              } else if (PATTERNS.CYRILIC().test(d)) {
                evals.push("c");
              } else {
                evals.push("?");
              }
            }
            const newLetters = [];
            for (let e = 0; e < evals.length; e++) {
              const c = evals[e];
              switch (c) {
                case "s":
                  newLetters.push(PATTERNS.getRandomSymbol(v));
                  break;
                case "l":
                  newLetters.push(
                    [
                      PATTERNS.getRandomChar(0x0041, 0x005a),
                      PATTERNS.getRandomChar(0x0061, 0x007a),
                      PATTERNS.getRandomChar(0x00c0, 0x00ff),
                    ][Math.floor(Math.random() * 3)]
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
                case "a":
                  newLetters.push(
                    Math.random() < 0.6
                      ? PATTERNS.getRandomChar(0x0600, 0x06ff)
                      : Math.random() < 0.8
                      ? PATTERNS.getRandomChar(0x0750, 0x077f)
                      : PATTERNS.getRandomChar(0x08a0, 0x08ff)
                  );
                  break;
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
          if (
            /(?:cpf|cpnj|celular|telefone|phone|ssn|rg)[\s\t\n=:]*/gi.test(k)
          ) {
            const chars = newWord.split("");
            for (let a = 0; a < chars.length; a++) {
              if (PATTERNS.NUMBERS().test(chars[a]))
                chars[a] = PATTERNS.getRandomSymbol(newWord);
            }
            newWord = chars.join("");
          }
          if (newWord.length < v.length) {
            const fallback =
              crypto?.randomUUID() || Math.random().toString(36).slice(2);
            newWord += fallback
              .slice(0, v.length - newWord.length)
              .replace(/[@\/.\u20A0-\u20CF]/g, "a");
          }
          const row = tbd.insertRow();
          row.insertCell().textContent = (i + 1).toString();
          row.insertCell().textContent = k
            .replace(/^[,_=]+/, "")
            .replace(/[,_=]+$/, "")
            .replaceAll(",", "")
            .toUpperCase();
          row.insertCell().textContent = newWord;
        });
      };
    if (outp) outp.innerText = "";
    document.getElementById(patternsTitle)?.remove();
    try {
      const winner = await Promise.race([
        (async () => {
          return new Promise(resolve => {
            loadingId = Swal.fire({
              title: "Processing the text...",
              html: "Checking if any tokens need to be masked...",
              timer: limit,
              timerProgressBar: true,
              didOpen: () => {
                Swal.showLoading();
                const timer = Swal.getPopup()?.querySelector("b");
                timerInterval = setInterval(() => {
                  if (timer) timer.textContent = `${Swal.getTimerLeft()}`;
                }, 1000);
              },
              willClose: () => {
                clearInterval(timerInterval);
                Swal.hideLoading();
              },
            });
            setTimeout(() => resolve({ timerFinished: true }), limit);
          });
        })(),
        (async () => {
          try {
            if (!txt) {
              if (typeof txt === "string") empty = true;
              throw new TypeError(`Invalid error: `);
            }
            for (let w = 0; w < txt.length; w++) {
              if (failed) break;
              for (let i = 0; i < dictEntries.length; i++) {
                const localDicts: [string, any] = dictEntries[i];
                for (let j = 0; j < Object.values(localDicts).length; j++) {
                  const exps = Object.entries(localDicts[1]);
                  for (let k = 0; k < exps.length; k++) {
                    const exp = exps[k][1],
                      key = exps[k][0];
                    if (exp instanceof RegExp && exp.test(txt[w]))
                      results.push({ k: key, e: exp, v: txt[w] });
                    else if (
                      typeof exp === "string" &&
                      txt[w].trim().toLowerCase() === exp
                    )
                      results.push({ k: key, e: exp, v: txt[w] });
                  }
                }
              }
            }
            return { completed: true, results, timerFinished: false };
          } catch (error) {
            return { completed: false, error, timerFinished: false };
          }
        })().then(result => ({ ...result, timerFinished: false })),
      ]);
      if (txt?.length) await new Promise(resolve => setTimeout(resolve, 1000));
      else await new Promise(resolve => setTimeout(resolve, 200));
      Swal.hideLoading();
      if (loadingId && typeof loadingId.close === "function") loadingId.close();
      else Swal.close();
      if (txt?.length) await new Promise(resolve => setTimeout(resolve, 250));
      else await new Promise(resolve => setTimeout(resolve, 200));
      if (!winner || !txt) return;
      if ((winner as any).timerFinished) {
        failed = true;
        await Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Timeout reached! Try again later!",
        });
        return;
      } else if ((winner as any).completed) {
        if (!results)
          Swal.fire({
            title: "There was an error reading your prompt!",
            icon: "error",
          });
        else if (empty || !txt?.length)
          Swal.fire({
            title: "Your prompt was read as empty!",
            icon: "warning",
          });
        else if (!results.length)
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
            mountTable(document.querySelector(".actions"));
          }
        }
      } else {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text:
            "An error occurred during processing: " +
            ((winner as any).error?.message || "Unknown error"),
        });
        return;
      }
    } catch {
      Swal.close();
      await new Promise(resolve => setTimeout(resolve, 250));
      Swal.fire({
        icon: "error",
        text: "An undefined error occurred. Please try again later.",
      });
    } finally {
      clearInterval(timerInterval);
    }
  }
}
