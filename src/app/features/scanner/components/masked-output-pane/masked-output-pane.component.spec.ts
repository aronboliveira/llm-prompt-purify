import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { MaskedOutputPaneComponent } from "./masked-output-pane.component";
import { DomSanitizer } from "@angular/platform-browser";

describe("MaskedOutputPaneComponent", () => {
  let component: MaskedOutputPaneComponent;
  let fixture: ComponentFixture<MaskedOutputPaneComponent>;
  let element: HTMLElement;
  let sanitizer: DomSanitizer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaskedOutputPaneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MaskedOutputPaneComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    sanitizer = TestBed.inject(DomSanitizer);

    // Set all required inputs
    fixture.componentRef.setInput("title", "Masked Output");
    fixture.componentRef.setInput("body", "Copy this sanitized text");
    fixture.componentRef.setInput("maskedText", "");
    fixture.componentRef.setInput("emptyPlaceholder", "No output yet");
    fixture.componentRef.setInput("statusMessage", "Ready");
    fixture.componentRef.setInput("detectionModeLabel", "Standard");
    fixture.componentRef.setInput("statusTone", "info");
    fixture.componentRef.setInput(
      "copyIcon",
      sanitizer.bypassSecurityTrustHtml("<svg></svg>"),
    );
    fixture.componentRef.setInput(
      "helpIcon",
      sanitizer.bypassSecurityTrustHtml("<svg></svg>"),
    );
    fixture.componentRef.setInput(
      "refreshIcon",
      sanitizer.bypassSecurityTrustHtml("<svg></svg>"),
    );
    fixture.componentRef.setInput("isScanning", false);
    fixture.componentRef.setInput("hasResult", false);
    fixture.componentRef.setInput("canCopy", false);
    fixture.componentRef.setInput("hasMatches", false);
    fixture.componentRef.setInput("hasSourceText", false);
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should display the title", () => {
    fixture.componentRef.setInput("title", "Masked Output");
    fixture.detectChanges();

    const titleEl = element.querySelector("h2");
    expect(titleEl?.textContent).toBe("Masked Output");
  });

  it("should display masked text", () => {
    fixture.componentRef.setInput("maskedText", "Hello ***@***.com");
    fixture.componentRef.setInput("hasResult", true);
    fixture.detectChanges();

    const outputEl = element.querySelector(".output__text");
    expect(outputEl?.textContent).toContain("Hello ***@***.com");
  });

  it("should display status pill with correct tone", () => {
    fixture.componentRef.setInput("statusMessage", "Protected");
    fixture.componentRef.setInput("statusTone", "success");
    fixture.detectChanges();

    const pillEl = element.querySelector(".status-pill");
    expect(pillEl?.textContent).toContain("Protected");
    expect(pillEl?.getAttribute("data-tone")).toBe("success");
  });

  it("should emit copyRequested event when copy button is clicked", () => {
    fixture.componentRef.setInput("canCopy", true);
    fixture.detectChanges();
    const emitSpy = jest.spyOn(component.copyRequested, "emit");

    const copyBtn = element.querySelector(
      ".pane__button--copy",
    ) as HTMLButtonElement;
    copyBtn?.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it("should emit regenerateRequested event when regenerate button is clicked", () => {
    fixture.componentRef.setInput("hasMatches", true);
    fixture.detectChanges();
    const emitSpy = jest.spyOn(component.regenerateRequested, "emit");

    const regenerateBtn = element.querySelector(
      ".pane__actions .pane__button:not(.pane__button--ghost)",
    ) as HTMLButtonElement;
    regenerateBtn?.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it("should emit clearRequested event when clear button is clicked", () => {
    fixture.componentRef.setInput("hasSourceText", true);
    fixture.detectChanges();
    const emitSpy = jest.spyOn(component.clearRequested, "emit");

    const clearBtn = element.querySelector(
      ".pane__button--ghost",
    ) as HTMLButtonElement;
    clearBtn?.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it("should disable copy button when canCopy is false", () => {
    fixture.componentRef.setInput("canCopy", false);
    fixture.detectChanges();

    const copyBtn = element.querySelector(
      ".pane__button--copy",
    ) as HTMLButtonElement;
    expect(copyBtn?.disabled).toBe(true);
  });

  it("should show spinner when scanning", () => {
    fixture.componentRef.setInput("isScanning", true);
    fixture.detectChanges();

    const spinnerEl = element.querySelector(".spinner");
    expect(spinnerEl).toBeTruthy();
  });

  it("should show placeholder when maskedText is empty", () => {
    fixture.componentRef.setInput("maskedText", "");
    fixture.componentRef.setInput("hasResult", false);
    fixture.componentRef.setInput("emptyPlaceholder", "No output yet");
    fixture.detectChanges();

    const outputEl = element.querySelector(".output__text");
    expect(outputEl?.textContent).toContain("No output yet");
  });

  it("should emit helpRequested when help button is clicked", () => {
    fixture.detectChanges();
    const emitSpy = jest.spyOn(component.helpRequested, "emit");

    const helpBtn = element.querySelector(".help-trigger") as HTMLButtonElement;
    helpBtn?.click();

    expect(emitSpy).toHaveBeenCalled();
  });
});
