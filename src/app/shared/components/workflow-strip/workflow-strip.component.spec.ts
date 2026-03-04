import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WorkflowStripComponent } from "./workflow-strip.component";
import { WorkflowSnippet, WorkflowState } from "./workflow-strip.types";

describe("WorkflowStripComponent", () => {
  let component: WorkflowStripComponent;
  let fixture: ComponentFixture<WorkflowStripComponent>;
  let element: HTMLElement;

  const mockSnippets: WorkflowSnippet[] = [
    { id: "step-1", title: "Step 1", body: "First step description" },
    { id: "step-2", title: "Step 2", body: "Second step description" },
    { id: "step-3", title: "Step 3", body: "Third step description" },
  ];

  const defaultStateResolver = (id: string): WorkflowState => "idle";

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowStripComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowStripComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    // Set required inputs
    fixture.componentRef.setInput("snippets", mockSnippets);
    fixture.componentRef.setInput("stateResolver", defaultStateResolver);
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should render all workflow snippets", () => {
    fixture.detectChanges();

    const cardEls = element.querySelectorAll(".workflow-strip__card");
    expect(cardEls.length).toBe(3);
  });

  it("should display snippet titles and bodies", () => {
    fixture.detectChanges();

    const titles = element.querySelectorAll(".workflow-strip__title");
    const bodies = element.querySelectorAll(".workflow-strip__body");

    expect(titles[0]?.textContent).toBe("Step 1");
    expect(bodies[0]?.textContent).toBe("First step description");
  });

  it("should apply correct data-state attribute based on stateResolver", () => {
    const stateResolver = (id: string): WorkflowState => {
      if (id === "step-1") return "done";
      if (id === "step-2") return "active";
      return "idle";
    };

    fixture.componentRef.setInput("stateResolver", stateResolver);
    fixture.detectChanges();

    const cardEls = element.querySelectorAll(".workflow-strip__card");

    expect(cardEls[0]?.getAttribute("data-state")).toBe("done");
    expect(cardEls[1]?.getAttribute("data-state")).toBe("active");
    expect(cardEls[2]?.getAttribute("data-state")).toBe("idle");
  });

  it("should display footer text when provided", () => {
    fixture.componentRef.setInput("footerText", "Workflow complete");
    fixture.detectChanges();

    const footerEls = element.querySelectorAll(".workflow-strip__footer");
    expect(footerEls.length).toBe(3); // Footer appears in each card
    expect(footerEls[0]?.textContent).toBe("Workflow complete");
  });

  it("should handle empty snippets array", () => {
    fixture.componentRef.setInput("snippets", []);
    fixture.detectChanges();

    const cardEls = element.querySelectorAll(".workflow-strip__card");
    expect(cardEls.length).toBe(0);
  });
});
