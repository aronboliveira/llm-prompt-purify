import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Renderer2,
} from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatIcon } from "@angular/material/icon";
import { fromEvent, Subscription } from "rxjs";
import { HelpToggleComponent } from "../help-toggle/help-toggle.component";
import { MatDialogModule } from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
@Component({
  selector: "app-fixed-header",
  templateUrl: "./fixed-header.component.html",
  styleUrls: ["./fixed-header.component.scss"],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButton,
    MatCheckboxModule,
    MatIcon,
    HelpToggleComponent,
  ],
  standalone: true,
})
export class FixedHeaderComponent implements AfterViewInit, OnDestroy {
  @ViewChild("header", { static: true }) header!: ElementRef<HTMLElement>;
  @ViewChild("toggleButton", { read: ElementRef })
  toggleButton: ElementRef<HTMLButtonElement> | null = null;
  public fixHeader = true;
  _permFixHeader = false;
  #scrollSubscription!: Subscription;
  #scrollTimeoutId: NodeJS.Timeout | number | undefined;
  #positionInterval: NodeJS.Timeout | number | undefined;
  #subscriptions = new Subscription();
  isHelpOpen = false;
  constructor(private _renderer: Renderer2) {}
  ngAfterViewInit(): void {
    if (typeof window === "undefined") return;
    if (!(this.header.nativeElement instanceof HTMLElement)) return;
    this.#scrollTimeoutId = setTimeout(() => {
      this.fixHeader = false;
    }, 3000);
    this.#scrollSubscription = fromEvent(window, "scroll").subscribe(() => {
      this.#scrollTimeoutId && clearTimeout(this.#scrollTimeoutId);
      this.fixHeader = true;
      this._renderer.setStyle(
        this.header.nativeElement,
        "transform",
        "translateY(0)"
      );
      this.#scrollTimeoutId = setTimeout(() => {
        this.fixHeader = false;
      }, 3000);
    });
    const atl = "autotranslate";
    if (this.header.nativeElement.getAttribute(`data-${atl}`) === "true")
      return;
    const idf =
      `#${this.header.nativeElement.id}` ||
      `[data-testid="${this.header.nativeElement.dataset["testid"]}"]` ||
      `.${this.header.nativeElement.className
        .replace(/\s{2,}/, " ")
        .replace(" ", ".")}`;
    if (window !== undefined)
      this.#positionInterval = setInterval(() => {
        if (!this.header.nativeElement?.isConnected)
          this.header.nativeElement = null as any;
        const hd = this.header.nativeElement ?? document.querySelector(idf);
        if (!hd?.isConnected) return;
        if (!this.fixHeader && !this._permFixHeader) {
          const trf = `translateY(-${hd.clientHeight}px)`;
          if (
            ["matrix(1, 0, 0, 1, 0, 0)", "", "none", undefined, null].includes(
              getComputedStyle(hd).transform
            )
          )
            hd.style.transform = trf;
          else hd.style.transform += `, ${trf}`;
        }
      }, 250);
    this.header.nativeElement.setAttribute(`data-${atl}`, "true");
  }
  ngOnDestroy(): void {
    this.#scrollSubscription?.unsubscribe();
    this.#subscriptions?.unsubscribe();
    this.#positionInterval = undefined;
    this.#scrollTimeoutId = undefined;
  }
  toggleFixHeader(): void {
    this._permFixHeader = !this._permFixHeader;
    if (typeof window === "undefined") return;
    console.log(this.toggleButton?.nativeElement);
    if (this.toggleButton?.nativeElement instanceof HTMLElement) {
      if (this._permFixHeader)
        this.toggleButton.nativeElement.dataset["active"] = "true";
      else this.toggleButton.nativeElement.dataset["active"] = "false";
    }
  }
  setDialogRef(): void {}
}
