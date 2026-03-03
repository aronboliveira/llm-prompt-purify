import { ScanSessionService } from "./scan-session.service";

describe("ScanSessionService", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("stores source text in session storage when updated", () => {
    const service = new ScanSessionService();

    service.updateSourceText("Email maria@example.com");

    expect(service.state().sourceText).toBe("Email maria@example.com");
    expect(sessionStorage.getItem("llm-prompt-purify:source-text:v2")).toBe(
      "Email maria@example.com"
    );
  });

  it("creates a scan result and can disable editable matches", async () => {
    const service = new ScanSessionService();

    service.updateSourceText("Email: maria@example.com\nCPF: 529.982.247-25");
    const scanPromise = service.runScan();
    jest.advanceTimersByTime(1000);
    await scanPromise;

    service.setAllEditableMatchesEnabled(false);

    expect(service.state().result?.enabledMatches).toBe(0);
    expect(service.state().result?.maskedText).toContain("maria@example.com");
    expect(service.state().result?.maskedText).toContain("529.982.247-25");
  });

  it("can disable a whole mask group after scanning", async () => {
    const service = new ScanSessionService();

    service.updateSourceText("Token: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890\nCPF: 529.982.247-25");
    const scanPromise = service.runScan();
    jest.advanceTimersByTime(1000);
    await scanPromise;

    service.toggleGroupEnabled("identifier", false);

    expect(service.state().result?.maskedText).toContain("529.982.247-25");
    expect(service.state().result?.maskedText).not.toContain(
      "sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    );
  });

  it("can regenerate an existing mask", async () => {
    const service = new ScanSessionService();

    service.updateSourceText("Email: maria@example.com");
    const scanPromise = service.runScan();
    jest.advanceTimersByTime(1000);
    await scanPromise;

    const firstMask = service.state().result?.matches[0].mask ?? "",
      matchId = service.state().result?.matches[0].id ?? "";

    service.regenerateMatch(matchId);

    expect(service.state().result?.matches[0].mask).not.toBe(firstMask);
  });

  it("clears the current session state", () => {
    const service = new ScanSessionService();

    service.updateSourceText("Token: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
    service.clear();

    expect(service.state()).toEqual({
      errorMessage: null,
      groupPreferences: service.state().groupPreferences,
      isScanning: false,
      result: null,
      scanPhase: "idle",
      sourceText: "",
      statusMessage: "Paste the original prompt, then run a local scan.",
    });
    expect(sessionStorage.getItem("llm-prompt-purify:source-text:v2")).toBeNull();
  });
});
