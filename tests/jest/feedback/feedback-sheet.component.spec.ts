import { HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FeedbackApiService } from "@core/feedback/feedback-api.service";
import { ToastCenterService } from "@core/feedback/toast-center.service";
import { ClientRateLimitError } from "@core/utils/client-rate-limiter";
import { FeedbackSheetComponent } from "@features/feedback/components/feedback-sheet/feedback-sheet.component";

describe("FeedbackSheetComponent", () => {
  let fixture: ComponentFixture<FeedbackSheetComponent>;
  let component: FeedbackSheetComponent;
  let feedbackApiMock: { submit: jest.Mock };
  let toastService: ToastCenterService;

  beforeEach(async () => {
    jest.useFakeTimers();

    feedbackApiMock = { submit: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [FeedbackSheetComponent],
      providers: [
        { provide: FeedbackApiService, useValue: feedbackApiMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackSheetComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastCenterService);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function openSheet(): void {
    (component as any).open();
    fixture.detectChanges();
  }

  function setMessage(value: string): void {
    (component as any).updateTextField("message", value);
    fixture.detectChanges();
  }

  function setCategory(value: string): void {
    (component as any).setCategory(value);
    fixture.detectChanges();
  }

  it("renders the feedback trigger button", () => {
    const trigger = fixture.nativeElement.querySelector(
      '[data-testid="feedback-trigger"]',
    );
    expect(trigger).not.toBeNull();
  });

  it("opens the sheet when the trigger button is clicked", () => {
    const trigger = fixture.nativeElement.querySelector(
      '[data-testid="feedback-trigger"]',
    );
    trigger.click();
    fixture.detectChanges();

    const messageField = fixture.nativeElement.querySelector(
      '[data-testid="feedback-message"]',
    );
    expect(messageField).not.toBeNull();
  });

  describe("submit validation", () => {
    it("shows validation error toast when submitting with empty message", async () => {
      openSheet();

      await (component as any).submit();

      const toasts = toastService.toasts();
      expect(toasts.length).toBeGreaterThan(0);
      expect(toasts[0]?.tone).toBe("error");
      expect(toasts[0]?.title).toContain("Check the feedback form");
    });

    it("does not call the API when validation fails", async () => {
      openSheet();

      await (component as any).submit();

      expect(feedbackApiMock.submit).not.toHaveBeenCalled();
    });
  });

  describe("ClientRateLimitError handling", () => {
    it("shows rate-limit toast when the client-side limiter rejects", async () => {
      feedbackApiMock.submit.mockRejectedValue(
        new ClientRateLimitError(8000, 3),
      );

      openSheet();
      setMessage("Great tool, but needs a dark mode.");

      await (component as any).submit();

      const toasts = toastService.toasts();
      expect(toasts.length).toBeGreaterThan(0);
      expect(toasts.some(t => t.body.includes("too quickly"))).toBe(true);
      expect(toasts.some(t => t.body.includes("8s"))).toBe(true);
    });
  });

  describe("server 429 Too Many Requests", () => {
    it("shows retry-after toast when the server responds with 429", async () => {
      feedbackApiMock.submit.mockRejectedValue(
        new HttpErrorResponse({
          status: 429,
          headers: new HttpHeaders({ "Retry-After": "120" }),
        }),
      );

      openSheet();
      setMessage("Great tool, but needs a dark mode.");

      await (component as any).submit();

      const toasts = toastService.toasts();
      expect(toasts.length).toBeGreaterThan(0);
      expect(toasts.some(t => t.body.includes("120s"))).toBe(true);
      expect(toasts.some(t => t.title.includes("Too many requests"))).toBe(
        true,
      );
    });

    it("defaults retry-after to 60s when header is missing", async () => {
      feedbackApiMock.submit.mockRejectedValue(
        new HttpErrorResponse({ status: 429 }),
      );

      openSheet();
      setMessage("Great tool, but needs a dark mode.");

      await (component as any).submit();

      const toasts = toastService.toasts();
      expect(toasts.some(t => t.body.includes("60s"))).toBe(true);
    });
  });

  describe("server 422 validation errors", () => {
    it("maps server-side field errors to the form and shows error toast", async () => {
      feedbackApiMock.submit.mockRejectedValue(
        new HttpErrorResponse({
          status: 422,
          error: { errors: { message: ["too long"], name: ["invalid name"] } },
        }),
      );

      openSheet();
      setMessage("Valid message here.");

      await (component as any).submit();

      const toasts = toastService.toasts();
      expect(toasts.some(t => t.tone === "error")).toBe(true);
      expect(
        toasts.some(t => t.title.includes("Fix the feedback form")),
      ).toBe(true);
    });

    it("ignores 422 errors without valid field names", async () => {
      feedbackApiMock.submit.mockRejectedValue(
        new HttpErrorResponse({
          status: 422,
          error: { errors: { unknown_field: ["bad"] } },
        }),
      );

      openSheet();
      setMessage("Valid message here.");

      await (component as any).submit();

      const toasts = toastService.toasts();
      // Still shows the generic validation error toast
      expect(
        toasts.some(t => t.title.includes("Fix the feedback form")),
      ).toBe(true);
    });
  });

  describe("unknown error handling", () => {
    it("shows generic error toast for server 500", async () => {
      feedbackApiMock.submit.mockRejectedValue(
        new HttpErrorResponse({ status: 500 }),
      );

      openSheet();
      setMessage("Great tool, but needs a dark mode.");

      await (component as any).submit();

      const toasts = toastService.toasts();
      expect(toasts.length).toBeGreaterThan(0);
      expect(toasts.some(t => t.tone === "error")).toBe(true);
      expect(toasts.some(t => t.title.includes("Feedback failed"))).toBe(
        true,
      );
    });

    it("shows generic error toast for non-HttpErrorResponse errors", async () => {
      feedbackApiMock.submit.mockRejectedValue(new Error("Network down"));

      openSheet();
      setMessage("Great tool, but needs a dark mode.");

      await (component as any).submit();

      const toasts = toastService.toasts();
      expect(toasts.some(t => t.title.includes("Feedback failed"))).toBe(
        true,
      );
    });

    it("resets isSubmitting to false after an error", async () => {
      feedbackApiMock.submit.mockRejectedValue(new Error("Network down"));

      openSheet();
      setMessage("Great tool, but needs a dark mode.");

      await (component as any).submit();

      expect((component as any).isSubmitting()).toBe(false);
    });
  });

  describe("success path", () => {
    it("shows success toast, resets the form, and closes the sheet", async () => {
      feedbackApiMock.submit.mockResolvedValue({
        id: "fb-001",
        message: "ok",
        deliveryStatus: "emailed",
        createdAtUtc: "2025-01-01T12:00:00Z",
      });

      openSheet();
      setMessage("Great tool, but needs a dark mode.");

      await (component as any).submit();

      const toasts = toastService.toasts();
      expect(toasts.some(t => t.tone === "success")).toBe(true);
      expect(toasts.some(t => t.title.includes("Feedback sent"))).toBe(true);

      // Sheet should be closed
      expect((component as any).isOpen()).toBe(false);
    });

    it("resets the draft to defaults after successful submission", async () => {
      feedbackApiMock.submit.mockResolvedValue({
        id: "fb-002",
        message: "ok",
        deliveryStatus: "queued",
        createdAtUtc: "2025-01-01T12:00:00Z",
      });

      openSheet();
      setMessage("Please add dark mode.");
      setCategory("bug-report");

      await (component as any).submit();

      // Draft should be back to defaults
      const draft = (component as any).draft();
      expect(draft.message).toBe("");
      expect(draft.category).toBe("general-feedback");
    });

    it("shows 'queued' info toast for queued delivery status", async () => {
      feedbackApiMock.submit.mockResolvedValue({
        id: "fb-003",
        message: "ok",
        deliveryStatus: "queued",
        createdAtUtc: "2025-01-01T12:00:00Z",
      });

      openSheet();
      setMessage("Thanks for the great tool.");

      await (component as any).submit();

      const toasts = toastService.toasts();
      expect(toasts.some(t => t.tone === "info")).toBe(true);
      expect(toasts.some(t => t.title.includes("Feedback queued"))).toBe(true);
    });

    it("calls submit with the correct request payload", async () => {
      feedbackApiMock.submit.mockResolvedValue({
        id: "fb-004",
        message: "ok",
        deliveryStatus: "emailed",
        createdAtUtc: "2025-01-01T12:00:00Z",
      });

      openSheet();
      setMessage("Love this tool!");

      await (component as any).submit();

      expect(feedbackApiMock.submit).toHaveBeenCalledTimes(1);
      const request = feedbackApiMock.submit.mock.calls[0][0];
      expect(request.message).toBe("Love this tool!");
      expect(request.category).toBe("general-feedback");
    });

    it("sets isSubmitting to false after successful submission", async () => {
      feedbackApiMock.submit.mockResolvedValue({
        id: "fb-005",
        message: "ok",
        deliveryStatus: "emailed",
        createdAtUtc: "2025-01-01T12:00:00Z",
      });

      openSheet();
      setMessage("Test.");

      await (component as any).submit();

      expect((component as any).isSubmitting()).toBe(false);
    });
  });
});
