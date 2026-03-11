import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { ControlsPanelComponent } from "./controls-panel.component";

describe("ControlsPanelComponent", () => {
  let component: ControlsPanelComponent;
  let fixture: ComponentFixture<ControlsPanelComponent>;
  let element: HTMLElement;

  const mockGroups = [
    {
      id: "pii",
      label: "PII",
      description: "Personal information",
      enabled: true,
      alwaysOn: false,
    },
    {
      id: "secrets",
      label: "Secrets",
      description: "API keys and tokens",
      enabled: true,
      alwaysOn: true,
    },
  ];

  const mockMatches: never[] = [];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlsPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ControlsPanelComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    // Set required inputs
    fixture.componentRef.setInput("title", "Masking Rules");
    fixture.componentRef.setInput("body", "Configure your rules");
    fixture.componentRef.setInput("groups", mockGroups);
    fixture.componentRef.setInput("matches", mockMatches);
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should display the title", () => {
    fixture.componentRef.setInput("title", "Masking Rules");
    fixture.detectChanges();

    const titleEl = element.querySelector("h2");
    expect(titleEl?.textContent).toBe("Masking Rules");
  });

  it("should display the body text", () => {
    fixture.componentRef.setInput("body", "Configure your rules");
    fixture.detectChanges();

    const bodyEl = element.querySelector(".controls__body");
    expect(bodyEl?.textContent).toBe("Configure your rules");
  });

  it("should emit helpRequested when help button is clicked", () => {
    fixture.detectChanges();
    const emitSpy = jest.spyOn(component.helpRequested, "emit");

    const helpBtn = element.querySelector(".help-trigger") as HTMLButtonElement;
    helpBtn?.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it("should pass groups to MaskGroupPanelComponent", () => {
    fixture.detectChanges();

    const maskGroupPanel = element.querySelector("app-mask-group-panel");
    expect(maskGroupPanel).toBeTruthy();
  });
});
