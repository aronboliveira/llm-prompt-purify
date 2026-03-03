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

  it("stores the selected country profile and detection mode", () => {
    const service = new ScanSessionService();

    service.setCountryProfile("cl");
    service.setDetectionMode("global-only");

    expect(service.state().countryProfileId).toBe("cl");
    expect(service.state().detectionMode).toBe("global-only");
    expect(sessionStorage.getItem("llm-prompt-purify:country-profile:v1")).toBe("cl");
    expect(sessionStorage.getItem("llm-prompt-purify:detection-mode:v1")).toBe("global-only");
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

  it("uses global-only mode to skip country-specific document matches", async () => {
    const service = new ScanSessionService();

    service.setCountryProfile("br");
    service.setDetectionMode("global-only");
    service.updateSourceText("CPF: 529.982.247-25\nEmail: maria@example.com");
    const scanPromise = service.runScan();
    jest.advanceTimersByTime(1000);
    await scanPromise;

    expect(service.state().result?.matches.some(match => match.ruleId === "cpf")).toBe(false);
    expect(service.state().result?.maskedText).toContain("529.982.247-25");
    expect(service.state().result?.maskedText).not.toContain("maria@example.com");
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
      countryProfileId: "br",
      detectionMode: "country-plus-global",
      errorMessage: null,
      groupPreferences: service.state().groupPreferences,
      isScanning: false,
      result: null,
      scanPhase: "idle",
      sourceText: "",
      statusMessage: "Pick a country focus, paste the original prompt, then run a local scan.",
    });
    expect(sessionStorage.getItem("llm-prompt-purify:source-text:v2")).toBeNull();
  });
});
