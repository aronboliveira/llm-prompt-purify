import { TestBed } from "@angular/core/testing";

import { TEST_MASK_GROUP_SUMMARIES } from "../../../../testing/constants/component-fixtures.constants";
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
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll(".group-card")).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain("Credentials and API keys");
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
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector("[data-testid='group-lock-credential']").disabled
    ).toBe(true);
  });

  it("emits group toggle events from the rendered inputs", () => {
    const fixture = TestBed.createComponent(MaskGroupPanelComponent),
      enabledSpy = jest.spyOn(fixture.componentInstance.groupEnabledToggled, "emit"),
      alwaysOnSpy = jest.spyOn(fixture.componentInstance.groupAlwaysOnToggled, "emit");

    fixture.componentRef.setInput("groups", TEST_MASK_GROUP_SUMMARIES);
    fixture.detectChanges();

    const groupToggle = fixture.nativeElement.querySelector(
        "[data-testid='group-toggle-credential']"
      ) as HTMLInputElement,
      groupLock = fixture.nativeElement.querySelector(
        "[data-testid='group-lock-credential']"
      ) as HTMLInputElement;

    groupToggle.checked = false;
    groupToggle.dispatchEvent(new Event("change"));

    groupLock.checked = true;
    groupLock.dispatchEvent(new Event("change"));

    expect(enabledSpy).toHaveBeenCalledWith({
      enabled: false,
      groupId: "credential",
    });
    expect(alwaysOnSpy).toHaveBeenCalledWith({
      alwaysOn: true,
      groupId: "credential",
    });
  });
});
