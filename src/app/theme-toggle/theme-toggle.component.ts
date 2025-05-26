import { Component } from "@angular/core";
import { Observable, debounceTime, distinctUntilChanged } from "rxjs";
import { ThemeService } from "../libs/state/theme.service";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import SVG_MAP from "../libs/vars/svgs";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
@Component({
  selector: "app-theme-toggle",
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: "./theme-toggle.component.html",
  styleUrl: "./theme-toggle.component.scss",
})
export class ThemeToggleComponent {
  dark$: Observable<boolean> | null = null;
  moon: string | SafeHtml = "dark_mode";
  sun: string | SafeHtml = "light_mode";
  constructor(public svc: ThemeService, private _sanitizer: DomSanitizer) {
    this.dark$ = this.svc.dark$.pipe(debounceTime(100), distinctUntilChanged());
    this.moon = this._sanitizer.bypassSecurityTrustHtml(
      SVG_MAP["moonStarsNoFill"]
    );
    this.sun = this._sanitizer.bypassSecurityTrustHtml(SVG_MAP["sunNoFill"]);
  }
}
