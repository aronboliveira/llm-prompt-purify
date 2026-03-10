import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { ScannerToolbarComponent } from "./scanner-toolbar.component";
import { DomSanitizer } from "@angular/platform-browser";

describe("ScannerToolbarComponent", () => {
  let component: ScannerToolbarComponent;
  let fixture: ComponentFixture<ScannerToolbarComponent>;
  let element: HTMLElement;
  let sanitizer: DomSanitizer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerToolbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScannerToolbarComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    sanitizer = TestBed.inject(DomSanitizer);

    // Set required inputs
    fixture.componentRef.setInput("countrySummary", "USA, Canada");
    fixture.componentRef.setInput("scopeDescription", "Country Scope");
    fixture.componentRef.setInput(
      "settingsIcon",
      sanitizer.bypassSecurityTrustHtml("<svg></svg>"),
    );
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should display country summary", () => {
    fixture.componentRef.setInput("countrySummary", "USA, Canada, UK");
    fixture.detectChanges();

    const summaryEl = element.querySelector(".scanner-toolbar__button-value");
    expect(summaryEl?.textContent).toContain("USA, Canada, UK");
  });

  it("should emit countryModalRequested when scope button is clicked", () => {
    fixture.detectChanges();
    const emitSpy = jest.spyOn(component.countryModalRequested, "emit");

    const scopeBtn = element.querySelector(
      ".scanner-toolbar__button--scope",
    ) as HTMLButtonElement;
    scopeBtn?.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it("should emit settingsModalRequested when settings button is clicked", () => {
    fixture.detectChanges();
    const emitSpy = jest.spyOn(component.settingsModalRequested, "emit");

    const settingsBtn = element.querySelector(
      ".scanner-toolbar__button--settings",
    ) as HTMLButtonElement;
    settingsBtn?.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it("should show warning when showWarning is true and warning is provided", () => {
    fixture.componentRef.setInput("warning", "Please select a country");
    fixture.componentRef.setInput("showWarning", true);
    fixture.detectChanges();

    const warningEl = element.querySelector(
      ".scanner-toolbar__warning",
    ) as HTMLDetailsElement;
    expect(warningEl).toBeTruthy();
    expect(warningEl.open).toBe(false);
    expect(warningEl?.textContent).toContain("Please select a country");
  });

  it("should hide warning when showWarning is false", () => {
    fixture.componentRef.setInput("warning", "Some warning");
    fixture.componentRef.setInput("showWarning", false);
    fixture.detectChanges();

    const warningEl = element.querySelector(".scanner-toolbar__warning");
    expect(warningEl).toBeNull();
  });
});
