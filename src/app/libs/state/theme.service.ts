import { Injectable, Inject, Renderer2, RendererFactory2 } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { DOCUMENT } from "@angular/common";
import { appState } from "../state";
@Injectable({ providedIn: "root" })
export class ThemeService {
  private _renderer: Renderer2 | null = null;
  #dark = new BehaviorSubject<boolean>(false);
  readonly dark$ = this.#dark.asObservable();
  constructor(
    @Inject(DOCUMENT) private _document: Document,
    factory: RendererFactory2
  ) {
    this._renderer = factory.createRenderer(null, null);
    try {
      if (typeof window === "undefined")
        throw TypeError(`Failed to access window`);
      const stored = localStorage.getItem(appState.storageKey);
      if (!stored) throw new TypeError(`Could not access storage key`);
      const res = ThemeService.getStoredScheme();
      typeof res?.dict === "string"
        ? this.#toggleBodyClass(res.dict === "dark" ? true : false)
        : this.#applyOsPref();
    } catch (e) {
      this.#applyOsPref();
    }
  }
  get isDark(): boolean {
    return this.#dark.value;
  }
  toggle(): void {
    this.#toggleBodyClass(!this.#dark.value, true);
  }
  #applyOsPref(): void {
    try {
      if (typeof window === "undefined") this.#dark.next(false);
      this.#toggleBodyClass(
        window.matchMedia?.("(prefers-color-scheme: dark)").matches || false
      );
    } catch (e) {
      this.#dark.next(false);
    }
  }
  #toggleBodyClass(scheme: boolean = false, event: boolean = false): void {
    try {
      const dt = "dark-theme",
        lt = "light-theme";
      this.#dark.next(scheme);
      if (typeof window === "undefined") return;
      const toggle = (schemeOn: string, schemeOff: string) => {
        if (event) {
          new Set([
            this._document.body,
            ...[
              "matTh",
              "matTd",
              "matIc",
              "matBtn",
              "matMdIcn",
              "matIcBtn",
              "matTt",
              "matDlgCn",
              "matDlgSr",
            ].flatMap(cls =>
              Array.from(
                this._document.getElementsByClassName(
                  (appState.classes as any)[cls]
                )
              )
            ),
          ]).forEach(e => {
            try {
              if (e.classList.contains(schemeOff))
                this._renderer?.removeClass(e, schemeOff) ??
                  this._document.body.classList.remove(schemeOff);
              if (!e.classList.contains(schemeOn))
                this._renderer?.addClass(e, schemeOn) ??
                  this._document.body.classList.add(schemeOn);
              const toggled = "toggled-theme";
              if (!e.classList.contains(toggled))
                this._renderer?.addClass(e, toggled) ??
                  this._document.body.classList.add("toggled-theme");
            } catch (e) {
              // fail silently
            }
          });
        } else {
          this._renderer?.removeClass(this._document.body, schemeOff) ??
            this._document.body.classList.remove(schemeOff);
          this._renderer?.addClass(this._document.body, schemeOn) ??
            this._document.body.classList.add(schemeOn);
        }
        try {
          const res = ThemeService.getStoredScheme();
          if (!res?.dict) throw TypeError(`Scheme key was not found`);
          localStorage.setItem(
            appState.storageKey,
            JSON.stringify({
              ...res.dict,
              [appState.colorSchemeKey]: res.scheme,
            })
          );
        } catch (e) {
          console.error(`Failed to set theme on storage: ${e as Error}`);
        }
      };
      scheme ? toggle(dt, lt) : toggle(lt, dt);
    } catch (e) {
      this.#dark.next(scheme);
    }
  }
  static getStoredScheme(): { scheme: string | null; dict: object } | null {
    try {
      const stored = localStorage.getItem(appState.storageKey);
      if (!stored) throw new TypeError(`Could not access storage key`);
      return {
        scheme: JSON.parse(stored)?.[appState.colorSchemeKey] || null,
        dict: JSON.parse(stored),
      };
    } catch (e) {
      console.error(`Failed to set theme on storage: ${e as Error}`);
      return null;
    }
  }
}
