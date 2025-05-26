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
    this.#toggleBodyClass(!this.#dark.value);
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
  #toggleBodyClass(scheme: boolean = false): void {
    try {
      const dt = "dark-theme",
        lt = "light-theme";
      this.#dark.next(scheme);
      if (typeof window === "undefined") return;
      const toggle = (schemeOn: string, schemeOff: string) => {
        this._renderer?.removeClass(this._document.body, schemeOff) ??
          this._document.body.classList.remove(schemeOff);
        this._renderer?.addClass(this._document.body, schemeOn) ??
          this._document.body.classList.add(schemeOn);
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
