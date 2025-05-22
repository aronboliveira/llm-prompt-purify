import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  Renderer2,
  NgZone,
  ChangeDetectionStrategy,
} from "@angular/core";
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
import { FixedHeaderComponent } from "./fixed-header/fixed-header.component";
import { MAIN_DICT, PATTERNS } from "./libs/vars/dictionaries";
import { InfoDialogService } from "./libs/state/info-dialog-service";
import { PromptTableComponent } from "./prompt-table/prompt-table.component";
import { resultDict } from "../definitions/helpers";
import DOMValidator from "./libs/utils/dom/facades/DOMValidator";
import Swal from "sweetalert2";
import { MaskStorageService } from "./libs/services/mask-storage.service";
import { MatTooltipModule } from "@angular/material/tooltip";
import TableExecutive from "./libs/utils/dom/executives/TableExecutive";
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
    PromptTableComponent,
    ScanSubmitComponent,
    CompressPickerComponent,
    UnderDevelopmentComponent,
    MatTooltipModule,
  ],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("promptInput", { static: true }) input: ElementRef | null = null;
  isHelpOpen = false;
  userInput = "";
  title = "Masked Input";
  processedOutput = "";
  promptValueKey = "llmPromptToPurifyValue";
  safeHtml = "";
  labelPattern = "data-labelpattern";
  _maxLength = 4096;
  constructor(
    private _userInputService: UserInputSerivce,
    private _dlgService: InfoDialogService,
    private _maskStorage: MaskStorageService,
    private _renderer: Renderer2,
    private _zone: NgZone,
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
        promptInput.value = promptInput.value.trim();
        if (
          promptInput.value.length > 1 &&
          promptInput.selectionStart &&
          promptInput.value.slice(
            promptInput.selectionStart - 1,
            promptInput.selectionStart
          ) === "\n"
        ) {
          const caret = promptInput.selectionStart;
          promptInput.value = `${promptInput.value.slice(
            0,
            promptInput.selectionStart - 1
          )}${promptInput.value.slice(promptInput.selectionStart)}`;
          promptInput.setSelectionRange(caret - 1, caret - 1);
        }
      }
      if (DOMValidator.isCustomTextbox(promptInput))
        promptInput.textContent = promptInput.textContent?.trim() || "";
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
          if (
            DOMValidator.isDefaultTextbox(ppi) ||
            DOMValidator.isCustomTextbox(ppi)
          ) {
            if (DOMValidator.isDefaultTextbox(ppi)) {
              ppi.value = ppv.v;
              ppi.dispatchEvent(
                new InputEvent("input", {
                  bubbles: true,
                  cancelable: true,
                  inputType: "insertText",
                  data: ppv.v,
                })
              );
            } else if (DOMValidator.isCustomTextbox(ppi)) ppi.innerText = ppv.v;
            this.userInput = ppv.v;
          }
          if (
            ppi instanceof HTMLElement &&
            ppi.getAttribute("data-focused") !== "true" &&
            ((DOMValidator.isDefaultTextbox(ppi) && ppi.value === "") ||
              (DOMValidator.isCustomTextbox(ppi) && ppi.innerText === ""))
          ) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (DOMValidator.isDefaultTextbox(ppi)) ppi.value = ppv.v;
            else if (DOMValidator.isCustomTextbox(ppi)) ppi.innerText = ppv.v;
            this.userInput = ppv.v;
            ppi.dispatchEvent(
              new InputEvent("input", {
                bubbles: true,
                cancelable: true,
                inputType: "insertText",
                data: ppv.v,
              })
            );
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
    } catch (e) {
      // Fail silently
    }
  }
  copyOutput(toCopy: string = this.userInput): void {
    navigator.clipboard.writeText(toCopy.trim()).then(() => {
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
  async checkPrompt(): Promise<void> {
    let timerInterval: any,
      loadingId: any,
      failed = false,
      empty = false,
      results: Array<resultDict> = [];
    const txt = (this.userInput || "")
        ?.trim()
        .split(/[\s\n\t\r=,_]+/g)
        .filter(Boolean),
      dictEntries = Object.entries(MAIN_DICT).filter(Boolean),
      outpId = "resultOutput",
      patternsTitle = "patternsTitle",
      outp = document.getElementById(outpId),
      limit = 60_000;
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
                const spinnerContainer =
                  Swal.getPopup()?.querySelector(".swal2-actions");
                if (spinnerContainer instanceof HTMLElement)
                  spinnerContainer.style.paddingBottom = "2rem";
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
                  const exps: Array<[string, RegExp]> = Object.entries(
                    localDicts[1]
                  );
                  for (let k = 0; k < exps.length; k++) {
                    let matched = false;
                    const exp = exps[k][1],
                      key = exps[k][0],
                      res = exp.exec(this.userInput);
                    if (
                      exp instanceof RegExp &&
                      res &&
                      !results.some(r => res.index === r.foundIn)
                    ) {
                      results.push({
                        k: key,
                        e: exp,
                        v: res[0],
                        foundIn: res.index,
                        endsIn: res.index + res[0].length,
                      });
                      matched = true;
                    } else if (
                      typeof exp === "string" &&
                      res &&
                      txt[w].trim().toLowerCase() === exp &&
                      !results.some(r => res.index === r.foundIn)
                    ) {
                      results.push({
                        k: key,
                        e: exp,
                        v: res[0],
                        foundIn: res.index,
                        endsIn: res.index + res[0].length,
                      });
                      matched = true;
                    }
                    if (!matched) continue;
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
          this._dlgService.togglePromptTable({ prompt: this.userInput });
          if (document.querySelector(".prompt-table-modal")) {
            const { table, output } = this.#mountTable(
                document.querySelector("#prompt-table-flag"),
                results
              ),
              ensureTableRender = async () => {
                await new Promise(resolve => setTimeout(resolve, 200));
                if (
                  !(
                    table &&
                    (!document.getElementById(table.id) ||
                      !table.isConnected ||
                      !table.clientWidth)
                  )
                )
                  return;
                const matmdc = document
                  .querySelector(".prompt-table-modal")
                  ?.querySelector(".mat-mdc-dialog-content");
                if (matmdc) {
                  if (table) this._renderer.appendChild(matmdc, table);
                  else
                    this._renderer.setProperty(
                      this._renderer.createElement("div") as HTMLDivElement,
                      "innerText",
                      "Failed to render table! ❌"
                    );
                }
                if (
                  !(
                    output &&
                    (!document.getElementById(output.id) ||
                      !output.isConnected ||
                      !output.clientWidth)
                  ) ||
                  !matmdc
                )
                  return;
                if (output) this._renderer.appendChild(matmdc, output);
                else
                  this._renderer.setProperty(
                    this._renderer.createElement("div") as HTMLDivElement,
                    "innerText",
                    "Failed to render output! ❌"
                  );
              };
            ensureTableRender();
            // hack to deal with Angular SSR strict sanitization
            ensureTableRender();
            if (!table) throw TypeError("Table failed to mount");
            const masks = Array.from(table.querySelectorAll(".regenerate"));
            if (!output?.textContent)
              throw new TypeError(`Failed to write output text`);
            for (const act of [
              (e: any): void => e.classList.add("masked-output"),
            ])
              act(output);
            let newOutput = output.textContent;
            for (const mask of masks)
              newOutput =
                this.#spliceMask({
                  mask,
                  output,
                  newOutput,
                  lastEnd: 0,
                }) || newOutput;
            output.textContent = newOutput;
            // FAIL DISPLAY PROCEDURE
            if (
              !output?.textContent?.startsWith(this.userInput.slice(0, 3)) &&
              !masks
                .filter(m => m.textContent)
                .some(m => output?.textContent?.startsWith(m.textContent!))
            ) {
              if (output)
                output.textContent = "###FAILED TO RENDER MASKED OUTPUT";
              const sm = document.createElement("small"),
                cnt = document.getElementById("promptTableContent");
              sm.textContent = this.userInput;
              sm.id = "inputReflex";
              for (const { k, v } of [
                { k: "opacity", v: "0.75" },
                { k: "fontStyle", v: "italic" },
                { k: "font-size", v: "0.8rem" },
                { k: "display", v: "block" },
              ])
                this._renderer.setStyle(sm, k, v);
              await new Promise(resolve =>
                this._zone.runOutsideAngular(() =>
                  setTimeout(() => this._zone.run(resolve), 300)
                )
              );
              if (
                !document.getElementById("inputReflex") &&
                (output?.parentNode?.parentNode || cnt)
              )
                this._renderer.appendChild(
                  output?.parentNode ||
                    (output?.parentNode as any)?.parentNode ||
                    cnt,
                  sm
                );
            }
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
    } catch (e) {
      Swal.close();
      await new Promise(resolve => setTimeout(resolve, 250));
      Swal.fire({
        icon: "error",
        text: `An unexpected error occurred. Please try again later.
        `,
      });
      console.error(`[${(e as Error).name}]: ${(e as Error).message}`);
    } finally {
      clearInterval(timerInterval);
    }
  }
  #mountTable(
    targ: Element | null,
    results: Array<resultDict>
  ): { table: HTMLTableElement | null; output: HTMLOutputElement | null } {
    try {
      if (!targ) {
        console.warn(`The masking suggestions could not be mounted due to a falsish target for adjacent insertion:
        Target: ${(targ as any)?.toString()}`);
        throw new TypeError(`Failed to validate target`);
      }
      const tb = document.createElement("table"),
        th = document.createElement("thead"),
        tbd = document.createElement("tbody"),
        headers = ["Pattern Recognized", "Suggested Mask", "Use mask"],
        cap = document.createElement("caption"),
        r = this._renderer;
      tb.id = `scanResults`;
      cap.id = `captionScanResults`;
      cap.innerText = "Relation of patterns and suggested masks";
      for (const { k, v } of [
        { k: "fontSize", v: "0.8rem" },
        { k: "opacity", v: "0.7" },
        { k: "fontStyle", v: "italic" },
        { k: "textAlign", v: "center" },
        { k: "verticalAlign", v: "baseline" },
        { k: "paddingBlock", v: "1rem" },
      ]) {
        try {
          const dc = Object.getOwnPropertyDescriptor(cap.style, k);
          if (!dc?.writable) continue;
          cap.style.setProperty(
            k
              .replace(
                /([a-záàâäãéèêëíìîïóòôöõúùûüçñ0-9])([A-ZÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÇ])/g,
                "$1-$2"
              )
              .toLowerCase(),
            v
          );
        } catch (se) {
          continue;
        }
      }
      targ.insertAdjacentElement("afterend", tb);
      th.insertRow();
      headers.forEach(h => {
        const e = document.createElement("th");
        th.rows[0].appendChild(e);
        e.style.fontWeight = "bold";
        e.innerText = h;
      });
      for (const c of [cap, th, tbd]) tb.appendChild(c);
      results
        .sort((a, b) => a.foundIn - b.foundIn)
        .forEach(({ k, v, foundIn: f, endsIn: e }, i) => {
          let newWord = v,
            acc = 0;
          do {
            if (acc > v.length * 10) break;
            newWord = this.#generateMask(v, () =>
              Math.floor(Math.random() * 10)
            );
            acc += 1;
          } while (newWord === v);
          if (/(?:_*label_*)/gi.test(k)) {
            const chars = newWord.split("");
            for (let a = 0; a < chars.length; a++)
              if (PATTERNS.NUMBERS().test(chars[a]))
                chars[a] = PATTERNS.getRandomSymbol(newWord);
            newWord = chars.join("").replace(/\s/g, "-");
          }
          if (newWord.length < v.length)
            newWord = this.#padMask({ word: newWord, v });
          this._maskStorage.setMask(v, newWord);
          const row = tbd.insertRow(),
            labCell = row.insertCell();
          for (const act of [
            (e: any) => {
              e.textContent = k
                .replace(/^[,_=]+/, "")
                .replace(/[,_=]+$/, "")
                .replaceAll(",", "")
                .toUpperCase();
            },
            (e: any) => e.classList.add("label-cell"),
          ])
            act(labCell);
          const isLabPattern = ["_label", "-label"].some(p =>
            labCell.textContent?.toLowerCase().endsWith(p)
          );
          isLabPattern && labCell.setAttribute(this.labelPattern, "true");
          const maskCell = row.insertCell(),
            maskN = `mask_${i}`;
          for (const { k, v } of [
            { k: "textContent", v: newWord },
            { k: "title", v: "Click here to regenerate" },
            { k: "data-willuse", v: !isLabPattern ? "true" : "false" },
            { k: "id", v: maskN },
            { k: "data-idx", v: `mask_${i}` },
          ])
            maskCell.setAttribute(k, v);
          maskCell.classList.add("mask-cell");
          const maskSpan = document.createElement("span"),
            cycleSpan = document.createElement("kbd");
          for (const act of [
            (e: any): void => {
              e.textContent = newWord;
            },
            (e: any): void => e.classList.add("regenerate"),
            ...[
              { k: "start", v: f },
              { k: "end", v: e },
            ].map(({ k, v }) => {
              return (e: any) => e.setAttribute(`data-${k}`, v.toString());
            }),
            (e: any): void =>
              e.addEventListener(
                appState.regenerateEvent,
                async (ev: PointerEvent) => {
                  const tg = ev.currentTarget;
                  if (
                    !(
                      ev.button === 0 &&
                      tg instanceof HTMLElement &&
                      tg.textContent
                    )
                  )
                    return;
                  const prevMask = tg.textContent;
                  tg.textContent = this.#generateMask(prevMask);
                  await new Promise(resolve => setTimeout(resolve, 100));
                  const mskd = document.querySelector(".masked-output"),
                    willUse =
                      tg
                        .closest("tr")
                        ?.querySelector(".mask-cell")
                        ?.getAttribute("data-willuse") === "true";
                  if (
                    !(mskd instanceof HTMLElement && mskd.isConnected) ||
                    !willUse
                  )
                    return;
                  mskd.innerText = mskd.innerText.replace(
                    prevMask,
                    tg.textContent
                  );
                  const ot = mskd.getAttribute("data-original-token");
                  ot && this._maskStorage.setMask(ot, tg.textContent);
                }
              ),
            (e: any): void => e.setAttribute("data-original-token", v),
          ])
            act(maskSpan);
          for (const act of [
            (e: any): void => {
              e.textContent = "♻";
            },
            (e: any): void => e.classList.add("regenerate-btn"),
            (e: any): void =>
              e.addEventListener(
                appState.regenerateEvent,
                async (ev: PointerEvent) => {
                  if (
                    !(
                      ev.button === 0 && ev.currentTarget instanceof HTMLElement
                    )
                  )
                    return;
                  const tg = ev.currentTarget;
                  tg.style.backgroundColor = "#2222";
                  setTimeout(() => {
                    if (!(tg instanceof HTMLElement)) return;
                    tg.style.backgroundColor = "#eeee";
                  }, 100);
                  const cell =
                    tg.closest("td") ||
                    tg.closest("th") ||
                    tg.closest(".MuiTableCell-root");
                  if (!cell) return;
                  const regenMask = cell.querySelector(".regenerate");
                  if (
                    !(regenMask instanceof HTMLElement && regenMask.textContent)
                  )
                    return;
                  const prevMask = regenMask.textContent,
                    ot = regenMask.getAttribute("data-original-token");
                  regenMask.textContent = this.#generateMask(prevMask);
                  ot && this._maskStorage.setMask(ot, regenMask.textContent);
                  await new Promise(resolve => setTimeout(resolve, 100));
                  const mskd = document.querySelector(".masked-output"),
                    willUse = cell.getAttribute("data-willuse") === "true";
                  if (
                    !(mskd instanceof HTMLElement && mskd.isConnected) ||
                    !willUse
                  )
                    return;
                  mskd.innerText = mskd.innerText.replace(
                    prevMask,
                    regenMask.textContent
                  );
                }
              ),
          ])
            act(cycleSpan);
          for (const c of [maskSpan, cycleSpan]) maskCell.append(c);
          const cbCell = row.insertCell(),
            fsCb = document.createElement("fieldset"),
            cb = document.createElement("input");
          fsCb.style.border = "none";
          for (const { k, v } of [
            { k: "type", v: "checkbox" },
            { k: "data-controls", v: maskN },
            { k: "aria-controls", v: maskN },
          ])
            cb.setAttribute(k, v);
          cbCell.classList.add("check-cell");
          cb.checked = !isLabPattern ? true : false;
          cb.addEventListener(appState.uncheckMaskEvent, ev => {
            const tg = ev.currentTarget;
            try {
              if (!(tg instanceof HTMLInputElement && tg.type === "checkbox"))
                return;
              const acst = tg.closest("table") ?? document.body ?? document,
                maskCell = acst.querySelector(
                  `[data-idx="${tg.getAttribute("data-controls")}"]`
                );
              if (!maskCell) return;
              maskCell.setAttribute("data-willuse", tg.checked.toString());
              const mask = maskCell.querySelector(".regenerate"),
                output = tg
                  .closest(".mat-mdc-dialog-panel")
                  ?.querySelector(".masked-output"),
                st = mask?.getAttribute("data-start");
              if (!(output instanceof HTMLElement && output.textContent) || !st)
                return;
              const lastEnd = parseInt(st, 10);
              if (!Number.isFinite(lastEnd)) return;
              const newOutput = this.#spliceMask({
                mask,
                output,
                newOutput: output.textContent,
                lastEnd,
                acceptLabel: true,
                recycling: true,
                useMask: tg.checked,
              });
              output.textContent = newOutput || output.textContent;
            } catch (e) {
              Swal.fire({
                toast: true,
                icon: "warning",
                title: `Some error occured!: ${(e as Error).name}`,
              });
            }
          });
          fsCb.appendChild(cb);
          cbCell.append(fsCb);
        });
      const outp = r.createElement("output") as HTMLOutputElement,
        outpTitle = r.createElement("h3") as HTMLHeadingElement,
        res = tb.insertAdjacentElement("afterend", outp);
      if (!res) {
        console.error(`Failed to insert output element`);
        alert(
          `There has been a critical error creating your output! Contact us through our feedback page!`
        );
      }
      outp.innerText = this.userInput || "# FAILED TO CAPTURE USER INPUT ❌";
      outpTitle.innerText = this.title;
      for (const { k, v } of [
        { k: "margin", v: "1.5rem 1rem 0 1rem" },
        { k: "font-size", v: "1.25rem" },
        { k: "font-weight", v: "800" },
      ])
        r.setStyle(outpTitle, k, v);
      if (tb.parentElement?.isConnected && outp.isConnected)
        r.insertBefore(tb.parentElement, outpTitle, outp);
      setTimeout(() => {
        if (!(tb.parentElement?.isConnected && outp.isConnected)) return;
        r.insertBefore(tb.parentElement, outpTitle, outp);
        const hr = r.createElement("hr");
        for (const { k, v } of [
          { k: "width", v: "90%" },
          { k: "margin", v: "2rem 1rem" },
          { k: "border", v: "1px solid #00025" },
          { k: "opacity", v: "0.8" },
        ])
          r.setStyle(hr, k, v);
        r.insertBefore(tb.parentElement, hr, outpTitle);
        this.#mountCtaForTable(tb);
      }, 250);
      setTimeout(() => {
        if (!tb?.isConnected) return;
        if (!this.#setMatTableStyles(tb))
          console.warn(`Failed to set Material Styles for Table`);
        // TODO SORTING LOGIC
      }, 300);
      return { table: tb, output: outp };
    } catch (e) {
      console.error(`Table mounting failed due to ${(e as Error).name}`);
      return { table: null, output: null };
    }
  }
  #setMatTableStyles(tb: HTMLTableElement): boolean {
    try {
      if (!(tb?.isConnected && tb instanceof HTMLTableElement))
        throw new Error(`Table could not be validated`);
      const t = "mat-mdc-table",
        hrc = "mat-mad-header-row",
        rc = "mat-mdc-table-row-alt",
        hc = ["mat-mdc-header-cell", "columnheader"],
        bc = ["mat-mdc-cell", "cell"],
        rs = Array.from(tb.rows);
      if (!tb.classList.contains(t)) this._renderer.addClass(tb, t);
      for (let i = 0; i < rs.length; i++) {
        const r = rs[i];
        if (!i) !r.classList.contains(hrc) && this._renderer.addClass(r, hrc);
        else if (i % 2 === 1 && !r.classList.contains(rc))
          this._renderer.addClass(r, rc);
        for (const c of Array.from(r.cells)) {
          if (c.tagName.toLowerCase() === "th") {
            if (!c.classList.contains(hc[0])) this._renderer.addClass(c, hc[0]);
            if (c.role !== hc[1]) this._renderer.setAttribute(c, "role", hc[1]);
          } else if (c.tagName.toLowerCase() === "td") {
            if (!c.classList.contains(bc[0])) this._renderer.addClass(c, bc[0]);
            if (c.role !== bc[1]) this._renderer.setAttribute(c, "role", bc[1]);
          }
        }
      }
      return true;
    } catch (e) {
      console.error(`Error : ${(e as Error).name} — ${(e as Error).message}`);
      return false;
    }
  }
  async #mountCtaForTable(tb: HTMLElement): Promise<boolean> {
    try {
      if (!tb?.isConnected || !tb.parentElement)
        throw new TypeError(`Failed to validate prompt table in DOM`);
      const r = this._renderer,
        tbRelCta = r.createElement("fieldset") as HTMLFieldSetElement,
        btns = Array.from({ length: 3 }).map(
          () => r.createElement("button") as HTMLButtonElement
        ),
        cls = "fs-prompt-cta",
        exc = new TableExecutive(tb),
        propsList = [
          {
            idf: "unchkMasksBtn",
            tp: "mat-button",
            lb: "Uncheck All Masks",
            ic: "clear_all",
            lt: () => exc.toggleAllChecks(false),
          },
          {
            idf: "chkMasksBtn",
            tp: "mat-button",
            lb: "Check All Masks",
            ic: "done_all",
            lt: () => exc.toggleAllChecks(true),
          },
          {
            idf: "regenMasksBtn",
            tp: "mat-button",
            lb: "Regenerate All Masks",
            ic: "autorenew",
            lt: () => exc.dispatchAllRegenerates(),
          },
        ] as Array<{
          idf: `${string}MasksBtn`;
          tp: `mat-${string}`;
          lb: string;
          ic: string;
          lt: (args: any) => any;
          drt?: `mat-${string}`;
          sz?: string;
        }>;
      r.addClass(tbRelCta, cls);
      r.insertBefore(tb.parentElement, tbRelCta, tb);
      await new Promise(resolve => setTimeout(resolve, 50));
      const appendBtns = () => {
        for (let i = 0; i < propsList.length; i++) {
          const props = propsList[i],
            b = btns[i];
          if (!props.sz) props.sz = "small";
          if (!props.drt) props.drt = "mat-button";
          for (const args of [
            ["id", props.idf],
            [props.tp, ""],
            ["aria-label", props.lb],
          ])
            r.setAttribute(b, ...(args as [string, string]));
          r.listen(b, "pointerup", props.lt);
          const icon = r.createElement("mat-icon") as HTMLElement;
          for (const _cls of ["clear-button"]) r.addClass(b, _cls);
          r.setProperty(icon, "innerText", props.ic);
          for (const _cls of [
            "mat-icon",
            "mat-ligature-font",
            "mat-icon-no-color",
            "mat-mdc-icon",
            "mat-button__icon",
            "material-icons",
            "notranslate",
          ])
            r.addClass(icon, _cls);
          for (const [k, v] of [
            ["aria-hidden", "true"],
            ["role", "img"],
          ])
            r.setAttribute(icon, k, v);
          const lbEl = r.createElement("label") as HTMLLabelElement;
          r.setAttribute(lbEl, "for", props.idf);
          r.setProperty(lbEl, "innerText", props.lb);
          for (const args of [
            [b, icon],
            [b, lbEl],
            [tbRelCta, b],
          ])
            r.appendChild(...(args as [HTMLElement, Node]));
        }
      };
      if (!tbRelCta?.isConnected) {
        await new Promise(resolve => setTimeout(resolve, 50));
        r.insertBefore(tb.parentElement, tb, tbRelCta);
        appendBtns();
      } else appendBtns();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  #generateMask(
    targ: string,
    dCb: Function = (v: string) => PATTERNS.getRandomSymbol(v)
  ) {
    const iniLg = targ.length,
      evals = [];
    for (let l = 0; l < targ.length; l++) {
      const d = targ[l];
      if (PATTERNS.SYMBOLS().test(d) && !/[@\/.\u20A0-\u20CF]/.test(d))
        evals.push("s");
      else if (PATTERNS.LATINIZED_CHARS().test(d)) evals.push("l");
      else if (PATTERNS.NUMBERS().test(d)) evals.push("d");
      else if (PATTERNS.JAPANESE().test(d)) evals.push("j");
      else if (PATTERNS.HANGUL().test(d)) evals.push("hg");
      else if (PATTERNS.HAN().test(d)) evals.push("ha");
      else if (PATTERNS.ARABIC().test(d)) evals.push("a");
      else if (PATTERNS.CYRILIC().test(d)) evals.push("c");
      else evals.push("?");
    }
    const newLetters = [];
    for (let e = 0; e < evals.length; e++) {
      const c = evals[e];
      switch (c) {
        case "s":
          newLetters.push(PATTERNS.getRandomSymbol(targ));
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
          newLetters.push(dCb());
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
          newLetters.push(targ[e]);
      }
    }
    let newWord = newLetters.join("").replace(/\s/g, "-");
    if (newWord.length < iniLg)
      newWord = this.#padMask({ word: newWord, v: targ });
    if (targ === newWord)
      Swal.fire({
        toast: true,
        position: "top-right",
        icon: "warning",
        title: "Regenerating this mask didn't work!",
        text: "Try recreating the table.",
        timer: 3000,
        timerProgressBar: true,
        customClass: {
          popup: "colored-toast",
        },
      });
    return newWord;
  }
  #spliceMask({
    mask,
    output,
    newOutput,
    lastEnd,
    acceptLabel = false,
    recycling = false,
    useMask = true,
  }: {
    mask: Element | null;
    output: HTMLElement | null;
    newOutput: string;
    lastEnd: number;
    acceptLabel?: boolean;
    recycling?: boolean;
    useMask?: boolean;
  }): string | void {
    if (
      !(mask instanceof HTMLElement) ||
      !mask.textContent ||
      !output?.textContent ||
      (!acceptLabel &&
        (
          mask.closest("tr") ||
          mask.closest("mat-mdc-row") ||
          mask.closest(".tr")
        )
          ?.querySelector(".label-cell")
          ?.getAttribute(this.labelPattern) === "true")
    )
      return;
    const st = mask.getAttribute("data-start"),
      end = mask.getAttribute("data-end");
    if (!(st && end)) return;
    const nSt = parseInt(st, 10),
      nEnd = parseInt(end, 10);
    if (!Number.isFinite(nSt) || !Number.isFinite(nEnd)) return;
    const intron = useMask
      ? mask.textContent
      : mask.getAttribute("data-original-token") || mask.textContent;
    return !recycling
      ? newOutput.slice(0, nSt + lastEnd) +
          intron +
          newOutput.slice(lastEnd + nEnd)
      : newOutput.slice(0, nSt) +
          intron +
          newOutput.slice(nSt + mask.textContent.length);
  }
  #padMask({ word, v }: { word: string; v: string }): string {
    word += crypto?.randomUUID() || Math.random().toString(36);
    word = word
      .slice(0, v.length - word.length)
      .replace(/[@\/.\u20A0-\u20CF]/g, "*");
    return word;
  }
}
