import { TestBed } from "@angular/core/testing";

import {
  TEST_MASK_GROUP_SUMMARIES,
  TEST_SCAN_MATCHES,
} from "../../../../testing/constants/component-fixtures.constants";
import { MaskGroupPanelComponent } from "./mask-group-panel.component";

describe("MaskGroupPanelComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaskGroupPanelComponent],
    }).compileComponents();
  });

  it("renders group cards and disabled states from the input model", () => {
    const fixture = TestBed.createComponent(MaskGroupPanelComponent);

    fixture.componentRef.setInput("groups", TEST_MASK_GROUP_SUMMARIES);
    fixture.componentRef.setInput("matches", TEST_SCAN_MATCHES);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll(".mask-fieldset")).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain("Credentials and API keys");
    expect(fixture.nativeElement.textContent).toContain("API key (A1B2-C3D4): sk-proj-EXAMPLE123456");
    expect(
      fixture.nativeElement.querySelector("[data-testid='group-toggle-identifier']")
        .checked
    ).toBe(false);
  });

  it("disables the always-on checkbox when a lockable group is turned off", () => {
    const fixture = TestBed.createComponent(MaskGroupPanelComponent),
      disabledCredentialGroups = TEST_MASK_GROUP_SUMMARIES.map(group =>
        group.id === "credential" ? { ...group, enabled: false } : group
      );

    fixture.componentRef.setInput("groups", disabledCredentialGroups);
    fixture.componentRef.setInput("matches", TEST_SCAN_MATCHES);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector("[data-testid='group-lock-credential']").disabled
    ).toBe(true);
  });

  it("emits group toggle events from the rendered inputs", () => {
    const fixture = TestBed.createComponent(MaskGroupPanelComponent),
      enabledSpy = jest.spyOn(fixture.componentInstance.groupEnabledToggled, "emit"),
      alwaysOnSpy = jest.spyOn(fixture.componentInstance.groupAlwaysOnToggled, "emit"),
      matchToggleSpy = jest.spyOn(fixture.componentInstance.matchToggled, "emit"),
      matchRegeneratedSpy = jest.spyOn(fixture.componentInstance.matchRegenerated, "emit");

    fixture.componentRef.setInput("groups", TEST_MASK_GROUP_SUMMARIES);
    fixture.componentRef.setInput("matches", TEST_SCAN_MATCHES);
    fixture.detectChanges();

    const groupToggle = fixture.nativeElement.querySelector(
        "[data-testid='group-toggle-credential']"
      ) as HTMLInputElement,
      groupLock = fixture.nativeElement.querySelector(
        "[data-testid='group-lock-credential']"
      ) as HTMLInputElement,
      matchToggle = fixture.nativeElement.querySelector(
        "[data-testid='toggle-cpf']"
      ) as HTMLInputElement,
      regenerateButton = fixture.nativeElement.querySelector(
        "[data-testid='regenerate-cpf']"
      ) as HTMLButtonElement;

    groupToggle.checked = false;
    groupToggle.dispatchEvent(new Event("change"));

    groupLock.checked = true;
    groupLock.dispatchEvent(new Event("change"));

    matchToggle.checked = true;
    matchToggle.dispatchEvent(new Event("change"));

    regenerateButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(enabledSpy).toHaveBeenCalledWith({
      enabled: false,
      groupId: "credential",
    });
    expect(alwaysOnSpy).toHaveBeenCalledWith({
      alwaysOn: true,
      groupId: "credential",
    });
    expect(matchToggleSpy).toHaveBeenCalledWith({
      enabled: true,
      matchId: "cpf:24:44",
    });
    expect(matchRegeneratedSpy).toHaveBeenCalledWith("cpf:24:44");
  });
});
