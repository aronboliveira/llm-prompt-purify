import { isPlatformBrowser } from "@angular/common";
import {
  Component,
  Renderer2,
  Inject,
  PLATFORM_ID,
  afterNextRender,
} from "@angular/core";
@Component({
  selector: "app-under-development",
  standalone: true,
  imports: [],
  templateUrl: "./under-development.component.html",
  styleUrl: "./under-development.component.scss",
})
export class UnderDevelopmentComponent {
  constructor(
    private _renderer: Renderer2,
    @Inject(PLATFORM_ID) private _platformId: Object
  ) {
    afterNextRender(
      () => isPlatformBrowser(this._platformId) && this.#showDevelopmentAlert()
    );
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
      const s = {
        color: "red",
        width: "100vw",
        position: "fixed",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        top: "0",
        backgroundColor: "#fff",
        zIndex: "999",
        fontWeight: "bold",
        fontSize: "1rem",
        padding: "10px",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
      };
      Object.keys(s).forEach(prop => {
        this._renderer.setStyle(alertDiv, prop, (s as any)[prop]);
      });
      document.body.firstChild
        ? this._renderer.insertBefore(
            document.body,
            alertDiv,
            document.body.firstChild
          )
        : this._renderer.appendChild(document.body, alertDiv);
    }, 200);
  }
}
