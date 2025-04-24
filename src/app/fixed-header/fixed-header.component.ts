import {
  Component,
  AfterViewInit,
  OnDestroy,
  OnInit,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatIcon } from "@angular/material/icon";
import { fromEvent, Subscription } from "rxjs";
const hdTlt = "headerTranslateY";
@Component({
  selector: "app-fixed-header",
  templateUrl: "./fixed-header.component.html",
  styleUrls: ["./fixed-header.component.scss"],
  standalone: true,
  imports: [MatButton, MatCheckboxModule, MatIcon],
})
export class FixedHeaderComponent implements AfterViewInit, OnDestroy {
  @ViewChild("header") header!: ElementRef<HTMLElement>;
  public fixHeader = true;
  #scrollSubscription!: Subscription;
  #scrollTimeoutId: NodeJS.Timeout | number | undefined;
  #headerTranslationY = 0;
  ngAfterViewInit(): void {
    if (!(this.header.nativeElement instanceof HTMLElement)) return;
    this.#headerTranslationY = this.header.nativeElement.clientHeight;
    this.#scrollTimeoutId = setTimeout(() => {
      this.fixHeader = false;
    }, 3000);
    this.#scrollSubscription = fromEvent(window, "scroll").subscribe(() => {
      this.#scrollTimeoutId && clearTimeout(this.#scrollTimeoutId);
      this.fixHeader = true;
      if (this.header.nativeElement instanceof HTMLElement) {
        this.header.nativeElement.style.transform = `translateY(0)`;
      }
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
    setInterval(() => {
      console.log("ticking...");
      if (!this.header.nativeElement?.isConnected)
        this.header.nativeElement = null as any;
      const hd = this.header.nativeElement ?? document.querySelector(idf);
      if (!hd?.isConnected) return;
      if (!this.fixHeader) {
        const trf = `translateY(-${hd.clientHeight}px)`;
        console.log([trf, getComputedStyle(hd).transform]);
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
    this.#scrollTimeoutId = undefined;
  }
  public toggleFixHeader(): void {
    this.fixHeader = !this.fixHeader;
  }
}
