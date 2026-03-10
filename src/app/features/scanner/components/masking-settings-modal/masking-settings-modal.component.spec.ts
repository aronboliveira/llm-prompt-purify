import { TestBed } from "@angular/core/testing";

import { MaskingSettingsModalComponent } from "./masking-settings-modal.component";

describe("MaskingSettingsModalComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaskingSettingsModalComponent],
    }).compileComponents();
  });

  it("renders nothing while closed and the settings toggle when open", () => {
    const fixture = TestBed.createComponent(MaskingSettingsModalComponent);

    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("[role='dialog']")).toBeNull();

    fixture.componentRef.setInput("detectionMode", "selected-plus-global");
    fixture.componentRef.setInput("isOpen", true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector("[data-testid='global-only-toggle']")).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain("Track only global identifiers");
    expect(fixture.nativeElement.textContent).toContain("Faker data caution");
    expect(fixture.nativeElement.textContent).toContain("Global-only mode can miss");
    expect(fixture.nativeElement.textContent).toContain("bypass masking entirely");
  });

  it("emits detection mode, help, and close events", () => {
    const fixture = TestBed.createComponent(MaskingSettingsModalComponent),
      modeSpy = jest.spyOn(fixture.componentInstance.detectionModeChanged, "emit"),
      helpSpy = jest.spyOn(fixture.componentInstance.helpRequested, "emit"),
      closeSpy = jest.spyOn(fixture.componentInstance.closed, "emit");

    fixture.componentRef.setInput("detectionMode", "selected-plus-global");
    fixture.componentRef.setInput("isOpen", true);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector(
      "[data-testid='global-only-toggle']"
    ) as HTMLInputElement;
    toggle.checked = true;
    toggle.dispatchEvent(new Event("change"));

    fixture.nativeElement
      .querySelector(".help-trigger")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    fixture.nativeElement
      .querySelector(".settings-modal__close")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(modeSpy).toHaveBeenCalledWith("global-only");
    expect(helpSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });
});
