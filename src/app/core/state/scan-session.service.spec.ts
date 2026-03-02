import { ScanSessionService } from "./scan-session.service";

describe("ScanSessionService", () => {
  beforeEach(() => sessionStorage.clear());

  it("stores source text in session storage when updated", () => {
    const service = new ScanSessionService();

    service.updateSourceText("Email maria@example.com");

    expect(service.state().sourceText).toBe("Email maria@example.com");
    expect(sessionStorage.getItem("llm-prompt-purify:source-text:v1")).toBe(
      "Email maria@example.com"
    );
  });

  it("creates a scan result and toggles all matches off", () => {
    const service = new ScanSessionService();

    service.updateSourceText("Email: maria@example.com\nCPF: 529.982.247-25");
    service.runScan();
    service.setAllMatchesEnabled(false);

    expect(service.state().result?.enabledMatches).toBe(0);
    expect(service.state().result?.maskedText).toContain("maria@example.com");
    expect(service.state().result?.maskedText).toContain("529.982.247-25");
  });

  it("clears the current session state", () => {
    const service = new ScanSessionService();

    service.updateSourceText("Token: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
    service.runScan();
    service.clear();

    expect(service.state()).toEqual({
      errorMessage: null,
      isScanning: false,
      result: null,
      sourceText: "",
    });
    expect(sessionStorage.getItem("llm-prompt-purify:source-text:v1")).toBeNull();
  });
});
