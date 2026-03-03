import { ToastCenterService } from "./toast-center.service";

describe("ToastCenterService", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("stores a toast and dismisses it after the configured lifetime", () => {
    const service = new ToastCenterService();

    service.push("The protected output is ready.", "Protected prompt copied", "success");

    expect(service.toasts()).toHaveLength(1);

    jest.advanceTimersByTime(3200);

    expect(service.toasts()).toHaveLength(0);
  });

  it("dismisses a toast immediately when requested", () => {
    const service = new ToastCenterService();

    service.push("Clipboard access failed.", "Copy failed", "error");
    const toastId = service.toasts()[0]?.id ?? "";

    service.dismiss(toastId);

    expect(service.toasts()).toHaveLength(0);
  });
});
