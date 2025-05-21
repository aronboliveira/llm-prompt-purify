import { isPlatformBrowser } from "@angular/common";
import {
  Component,
  Renderer2,
  Inject,
  PLATFORM_ID,
  afterNextRender,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { AfterViewInit, OnDestroy } from "@angular/core";
import { fromEvent, Subject, Subscription, takeUntil } from "rxjs";
@Component({
  selector: "app-under-development",
  standalone: true,
  imports: [],
  templateUrl: "./under-development.component.html",
  styleUrl: "./under-development.component.scss",
})
export class UnderDevelopmentComponent implements AfterViewInit, OnDestroy {
  @ViewChild("header", { static: false }) toolbar!: ElementRef<HTMLElement>;
  #scrollSubscription: Subscription | null = null;
  #timeout: NodeJS.Timeout | number | null = null;
  destroy$ = new Subject<void>();
  public fixHeader = true;
  constructor(
    private _renderer: Renderer2,
    @Inject(PLATFORM_ID) private _platformId: Object
  ) {
    afterNextRender(
      () => isPlatformBrowser(this._platformId) && this.#showDevelopmentAlert()
    );
  }
  ngAfterViewInit(): void {
    if (typeof window === "undefined") return;
    const _toolbar = document.getElementById("devAlert");
    if (!_toolbar) return;
    this.toolbar.nativeElement = _toolbar;
    this.#timeout = setTimeout(() => {
      this._renderer.setStyle(
        this.toolbar.nativeElement,
        "transform",
        `translateY(-${
          parseInt(getComputedStyle(this.toolbar.nativeElement).height) * 10
        }px)`
      );
    }, 10_000);
    this.#scrollSubscription = fromEvent(window, "scroll")
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.#timeout && clearTimeout(this.#timeout);
        this._renderer.setStyle(
          this.toolbar.nativeElement,
          "transform",
          "translateY()"
        );
        this.#timeout = setTimeout(() => {
          this._renderer.setStyle(
            this.toolbar.nativeElement,
            "transform",
            `translateY(-${
              parseInt(getComputedStyle(this.toolbar.nativeElement).height) * 10
            }px)`
          );
        }, 10_000);
      });
  }
  ngOnDestroy(): void {
    this.#scrollSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    this.#timeout = null;
    this.fixHeader = true;
    if (typeof window === "undefined") return;
    window.removeEventListener("scroll", () => this.#domHandler());
  }
  #showDevelopmentAlert(): void {
    setTimeout(() => {
      const alertDiv = this._renderer.createElement("div");
      this._renderer.setProperty(
        alertDiv,
        "textContent",
        "This page is still under early development!"
      );
      this._renderer.setAttribute(alertDiv, "id", "devAlert");
      document.body.firstChild
        ? this._renderer.insertBefore(
            document.body,
            alertDiv,
            document.body.firstChild
          )
        : this._renderer.appendChild(document.body, alertDiv);
      setTimeout(() => {
        if (typeof window === "undefined") return;
        const toolbar = document.getElementById("devAlert");
        if (!toolbar) return;
        const el =
          this.toolbar?.nativeElement || document.getElementById("devAlert");
        if (!el) return;
        this._renderer.setStyle(el, "transform", `translateY(0)`);
        window.addEventListener("scroll", () => this.#domHandler(toolbar));
      }, 200);
    }, 200);
  }
  #domHandler(toolbar?: HTMLElement): void {
    if (!toolbar) return;
    if (this.#timeout) clearTimeout(this.#timeout);
    toolbar.style.transform = "translateY(0)";
    this.#timeout = setTimeout(() => {
      const el =
        this.toolbar?.nativeElement || document.getElementById("devAlert");
      if (!el) return;
      this._renderer.setStyle(
        el,
        "transform",
        `translateY(-${parseInt(getComputedStyle(el).height) * 10}px)`
      );
    }, 10000);
  }
}
