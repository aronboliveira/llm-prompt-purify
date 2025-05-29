import {
  ComponentRef,
  Injector,
  Renderer2,
  ViewContainerRef,
} from "@angular/core";
import { MatTooltip } from "@angular/material/tooltip";

export default class MuiSupport {
  public static generateBaseMuiIcon(
    r: Renderer2,
    type: string
  ): HTMLElement | null {
    try {
      const icon = r.createElement("mat-icon") as HTMLElement;
      r.setProperty(icon, "innerText", type);
      for (const _cls of [
        "material-icons",
        "mat-icon",
        "mat-mdc-icon",
        "mat-icon-no-color",
        "mat-button__icon",
        "mat-ligature-font",
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
  public static addTooltipToElement({
    view,
    injector,
    el,
    txt,
  }: {
    view: ViewContainerRef;
    injector: Injector;
    el: HTMLElement | null;
    txt: string;
  }): boolean {
    try {
      const ttRef: ComponentRef<MatTooltip> = view.createComponent(MatTooltip, {
          injector,
        }),
        inst = ttRef.instance;
      inst.message = txt;
      (inst as any)._elementRef = { nativeElement: el };
      (inst as any).ngOnInit();
      (el as any)._tooltipRef = ttRef;
      return true;
    } catch (e) {
      return false;
    }
  }
}
