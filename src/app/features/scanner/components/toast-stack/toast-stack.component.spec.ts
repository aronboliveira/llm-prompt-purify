import { TestBed } from "@angular/core/testing";

import { TEST_TOAST_MESSAGES } from "@testing/constants/component-fixtures.constants";
import { ToastStackComponent } from "./toast-stack.component";

describe("ToastStackComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastStackComponent],
    }).compileComponents();
  });

  it("renders nothing when there are no toasts", () => {
    const fixture = TestBed.createComponent(ToastStackComponent);

    fixture.componentRef.setInput("toasts", []);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector(".toast-stack")).toBeNull();
  });

  it("renders toast roles and bodies from the input model", () => {
    const fixture = TestBed.createComponent(ToastStackComponent);

    fixture.componentRef.setInput("toasts", TEST_TOAST_MESSAGES);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll(".toast")).toHaveLength(2);
    expect(fixture.nativeElement.querySelector("[role='status']")).not.toBeNull();
    expect(fixture.nativeElement.querySelector("[role='alert']")).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain("Protected prompt copied");
    expect(fixture.nativeElement.textContent).toContain(
      "Clipboard access failed. Copy manually from the output block."
    );
  });

  it("emits dismiss events from the close button", () => {
    const fixture = TestBed.createComponent(ToastStackComponent),
      emitSpy = jest.spyOn(fixture.componentInstance.dismissed, "emit");

    fixture.componentRef.setInput("toasts", TEST_TOAST_MESSAGES);
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector(".toast__close")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(emitSpy).toHaveBeenCalledWith("toast-success");
  });
});
