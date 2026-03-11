import { TestBed } from "@angular/core/testing";

import {
  TEST_COUNTRY_PROFILES,
} from "@testing/constants/component-fixtures.constants";
import { CountryScopeModalComponent } from "./country-scope-modal.component";

describe("CountryScopeModalComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountryScopeModalComponent],
    }).compileComponents();
  });

  it("renders nothing while closed and lists country cards when open", () => {
    const fixture = TestBed.createComponent(CountryScopeModalComponent);

    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("[role='dialog']")).toBeNull();

    fixture.componentRef.setInput("countryProfiles", TEST_COUNTRY_PROFILES);
    fixture.componentRef.setInput("isOpen", true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll(".country-card")).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain("Brazil");
    expect(fixture.nativeElement.textContent).toContain("Spain");
  });

  it("emits toggle, help, and close events", () => {
    const fixture = TestBed.createComponent(CountryScopeModalComponent),
      toggleSpy = jest.spyOn(fixture.componentInstance.countryToggled, "emit"),
      helpSpy = jest.spyOn(fixture.componentInstance.helpRequested, "emit"),
      closeSpy = jest.spyOn(fixture.componentInstance.closed, "emit");

    fixture.componentRef.setInput("countryProfiles", TEST_COUNTRY_PROFILES);
    fixture.componentRef.setInput("isOpen", true);
    fixture.detectChanges();

    const secondToggle = fixture.nativeElement.querySelector(
      "[data-testid='country-toggle-es']"
    ) as HTMLInputElement;
    secondToggle.checked = true;
    secondToggle.dispatchEvent(new Event("change"));

    fixture.nativeElement
      .querySelector(".help-trigger")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    fixture.nativeElement
      .querySelector(".country-modal__close")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(toggleSpy).toHaveBeenCalledWith({
      countryProfileId: "es",
      selected: true,
    });
    expect(helpSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });
});
