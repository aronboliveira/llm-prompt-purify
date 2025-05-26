import { Renderer2 } from "@angular/core";

export default class IconsMapper {
  public static generateBaseMuiIcon(
    r: Renderer2,
    type: string
  ): HTMLElement | null {
    try {
      const icon = r.createElement("mat-icon") as HTMLElement;
      r.setProperty(icon, "innerText", type);
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
      return icon;
    } catch (e) {
      return null;
    }
  }
}
