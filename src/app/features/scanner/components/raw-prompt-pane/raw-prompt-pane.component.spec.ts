import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { RawPromptPaneComponent } from "./raw-prompt-pane.component";

describe("RawPromptPaneComponent", () => {
  let component: RawPromptPaneComponent;
  let fixture: ComponentFixture<RawPromptPaneComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RawPromptPaneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RawPromptPaneComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    // Set required inputs
    fixture.componentRef.setInput("title", "Raw Input");
    fixture.componentRef.setInput("body", "Enter your prompt");
    fixture.componentRef.setInput("sourceText", "");
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should display the title", () => {
    fixture.componentRef.setInput("title", "Raw Input");
    fixture.detectChanges();

    const titleEl = element.querySelector("h2");
    expect(titleEl?.textContent).toBe("Raw Input");
  });

  it("should display the body text", () => {
    fixture.componentRef.setInput("body", "Enter your prompt");
    fixture.detectChanges();

    const bodyEl = element.querySelector(".pane__body");
    expect(bodyEl?.textContent).toBe("Enter your prompt");
  });

  it("should bind sourceText to textarea value", async () => {
    fixture.componentRef.setInput("sourceText", "Initial text");
    fixture.detectChanges();
    await fixture.whenStable();

    const textarea = element.querySelector(".editor") as HTMLTextAreaElement;
    expect(textarea?.value).toBe("Initial text");
  });

  it("should emit sourceTextChanged on textarea input", () => {
    fixture.detectChanges();
    const emitSpy = jest.spyOn(component.sourceTextChanged, "emit");

    const textarea = element.querySelector(".editor") as HTMLTextAreaElement;
    textarea.value = "New text";
    textarea.dispatchEvent(new Event("input"));

    expect(emitSpy).toHaveBeenCalledWith("New text");
  });

  it("should display character count", () => {
    fixture.componentRef.setInput("sourceText", "Hello");
    fixture.detectChanges();

    const charCountEl = element.querySelector(".char-count");
    expect(charCountEl?.textContent).toContain("5");
  });

  it("should emit helpRequested when help button is clicked", () => {
    fixture.detectChanges();
    const emitSpy = jest.spyOn(component.helpRequested, "emit");

    const helpBtn = element.querySelector(".help-trigger") as HTMLButtonElement;
    helpBtn?.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it("should set placeholder on textarea", () => {
    fixture.componentRef.setInput("placeholder", "Type here...");
    fixture.detectChanges();

    const textarea = element.querySelector(".editor") as HTMLTextAreaElement;
    expect(textarea?.placeholder).toBe("Type here...");
  });
});
