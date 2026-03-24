import type { ScanMatch } from "../masking/declarations/masking.types";
import type {
  MaskSafetyHardener,
  MaskSafetyHardeningResult,
} from "../mask-safety/declarations/mask-safety.types";
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
    const service = createService();

    service.updateSourceText("Email maria@example.com");

    expect(service.state().sourceText).toBe("Email maria@example.com");
    expect(sessionStorage.getItem("llm-prompt-purify:source-text:v2")).toBe(
      "Email maria@example.com",
    );
  });

  it("stores the selected country scope and detection mode", () => {
    const service = createService();

    service.setCountryProfiles(["cl", "latam-es"]);
    service.setDetectionMode("global-only");

    expect(service.state().countryProfileIds).toEqual(["latam-es", "cl"]);
    expect(service.state().detectionMode).toBe("global-only");
    expect(
      sessionStorage.getItem("llm-prompt-purify:country-profiles:v2"),
    ).toBe(JSON.stringify(["latam-es", "cl"]));
    expect(sessionStorage.getItem("llm-prompt-purify:detection-mode:v1")).toBe(
      "global-only",
    );
  });

  it("creates a scan result and can disable editable matches", async () => {
    const service = createService();

    service.updateSourceText("Email: maria@example.com\nCPF: 529.982.247-25");
    const scanPromise = service.runScan();
    jest.advanceTimersByTime(1000);
    await scanPromise;

    service.setAllEditableMatchesEnabled(false);

    expect(service.state().result?.enabledMatches).toBe(0);
    expect(service.state().result?.maskedText).toContain("maria@example.com");
    expect(service.state().result?.maskedText).toContain("529.982.247-25");
  });

  it("uses global-only mode to mask labeled CPF via global rule", async () => {
    const service = createService();

    service.setCountryProfiles(["br"]);
    service.setDetectionMode("global-only");
    service.updateSourceText("CPF: 529.982.247-25\nEmail: maria@example.com");
    const scanPromise = service.runScan();
    jest.advanceTimersByTime(1000);
    await scanPromise;

    expect(
      service.state().result?.matches.some(match => match.ruleId === "cpf"),
    ).toBe(true);
    expect(service.state().result?.maskedText).not.toContain("529.982.247-25");
    expect(service.state().result?.maskedText).not.toContain(
      "maria@example.com",
    );
  });

  it("can disable a whole mask group after scanning", async () => {
    const service = createService();

    service.updateSourceText(
      "Token: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890\nCPF: 529.982.247-25",
    );
    const scanPromise = service.runScan();
    jest.advanceTimersByTime(1000);
    await scanPromise;

    service.toggleGroupEnabled("identifier", false);

    expect(service.state().result?.maskedText).toContain("529.982.247-25");
    expect(service.state().result?.maskedText).not.toContain(
      "sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
    );
  });

  it("can regenerate an existing mask after hardening", async () => {
    const service = createService();

    service.updateSourceText("Email: maria@example.com");
    const scanPromise = service.runScan();
    jest.advanceTimersByTime(1000);
    await scanPromise;

    const firstMask = service.state().result?.matches[0].mask ?? "",
      matchId = service.state().result?.matches[0].id ?? "";

    await service.regenerateMatch(matchId);

    expect(service.state().result?.matches[0].mask).not.toBe(firstMask);
  });

  it("applies async mask hardening before publishing the scan result", async () => {
    const service = createService({
      hardenMatches: async matches => ({
        matches: matches.map((match, index) =>
          index === 0 ? { ...match, mask: "111.111.111-11" } : match,
        ),
      }),
    });

    service.setCountryProfiles(["br"]);
    service.updateSourceText("CPF: 529.982.247-25");
    const scanPromise = service.runScan();
    jest.advanceTimersByTime(1000);
    await scanPromise;

    expect(service.state().result?.matches[0].mask).toBe("111.111.111-11");
  });

  it("clears the current session state", () => {
    const service = createService(),
      initialCountryProfileIds = service.state().countryProfileIds;

    service.updateSourceText(
      "Token: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
    );
    service.clear();

    expect(service.state()).toEqual({
      advancedPreferences: service.state().advancedPreferences,
      countryProfileIds: initialCountryProfileIds,
      detectionMode: "selected-plus-global",
      errorMessage: null,
      groupPreferences: service.state().groupPreferences,
      isScanning: false,
      result: null,
      scanPhase: "idle",
      sourceText: "",
      statusMessage:
        "Pick the masking scope, paste the raw prompt, and the protected output will rebuild locally.",
    });
    expect(
      sessionStorage.getItem("llm-prompt-purify:source-text:v2"),
    ).toBeNull();
  });
});

function createService(
  maskSafetyHardener: MaskSafetyHardener = createPassthroughHardener(),
) {
  return new ScanSessionService(maskSafetyHardener);
}

function createPassthroughHardener(): MaskSafetyHardener {
  return {
    hardenMatches(
      matches: readonly ScanMatch[],
    ): Promise<MaskSafetyHardeningResult> {
      return Promise.resolve({
        matches,
      });
    },
  };
}
