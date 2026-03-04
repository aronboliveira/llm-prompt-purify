import { TestBed } from "@angular/core/testing";

import { TEST_HELP_TOPIC } from "@testing/constants/component-fixtures.constants";
import { HelpModalComponent } from "./help-modal.component";

describe("HelpModalComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpModalComponent],
    }).compileComponents();
  });

  it("renders nothing when no help topic is provided", () => {
    const fixture = TestBed.createComponent(HelpModalComponent);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector("[role='dialog']")).toBeNull();
  });

  it("renders the active help topic content", () => {
    const fixture = TestBed.createComponent(HelpModalComponent);

    fixture.componentRef.setInput("topic", TEST_HELP_TOPIC);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(TEST_HELP_TOPIC.title);
    expect(fixture.nativeElement.textContent).toContain(TEST_HELP_TOPIC.paragraphs[0]);
  });

  it("emits close only for close-button and backdrop interactions", () => {
    const fixture = TestBed.createComponent(HelpModalComponent),
      emitSpy = jest.spyOn(fixture.componentInstance.closed, "emit");

    fixture.componentRef.setInput("topic", TEST_HELP_TOPIC);
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector(".modal")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(emitSpy).not.toHaveBeenCalled();

    fixture.nativeElement
      .querySelector(".modal-backdrop")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(emitSpy).toHaveBeenCalledTimes(1);

    fixture.nativeElement
      .querySelector(".modal__close")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(emitSpy).toHaveBeenCalledTimes(2);
  });
});
