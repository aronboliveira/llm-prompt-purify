import {
  ComponentRef,
  Injector,
  Renderer2,
  ViewContainerRef,
} from "@angular/core";
import { MatTooltip } from "@angular/material/tooltip";
import { appState } from "../../../state";

export default class MuiSupport {
  public static generateBaseMuiIcon(
    r: Renderer2,
    type: string
  ): HTMLElement | null {
    try {
      const icon = r.createElement(appState.classes.matIc) as HTMLElement;
      r.setProperty(icon, "innerText", type);
      for (const _cls of [
        appState.classes.matIcs,
        appState.classes.matIc,
        appState.classes.matMdIcn,
        appState.classes.matIcTp,
        appState.classes.matIcBtn,
        appState.classes.matLig,
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
