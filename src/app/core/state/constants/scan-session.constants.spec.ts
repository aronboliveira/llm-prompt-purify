import {
  resolveAdaptiveDebounceMs,
  SCAN_TIMINGS,
} from "./scan-session.constants";

describe("resolveAdaptiveDebounceMs", () => {
  it("returns autoRefreshDebounceMs for undefined inputType", () => {
    expect(resolveAdaptiveDebounceMs(undefined)).toBe(
      SCAN_TIMINGS.autoRefreshDebounceMs,
    );
  });

  it.each(["insertFromPaste", "insertFromPasteAsQuotation", "insertFromDrop"])(
    "returns pasteDebounceMs for %s",
    inputType => {
      expect(resolveAdaptiveDebounceMs(inputType)).toBe(
        SCAN_TIMINGS.pasteDebounceMs,
      );
    },
  );

  it.each(["insertText", "insertLineBreak"])(
    "returns typingDebounceMs for %s",
    inputType => {
      expect(resolveAdaptiveDebounceMs(inputType)).toBe(
        SCAN_TIMINGS.typingDebounceMs,
      );
    },
  );

  it.each([
    "deleteContentBackward",
    "deleteContentForward",
    "deleteWordBackward",
    "deleteByCut",
    "historyUndo",
    "historyRedo",
  ])("returns deleteDebounceMs for %s", inputType => {
    expect(resolveAdaptiveDebounceMs(inputType)).toBe(
      SCAN_TIMINGS.deleteDebounceMs,
    );
  });

  it("returns compositionDebounceMs for insertCompositionText", () => {
    expect(resolveAdaptiveDebounceMs("insertCompositionText")).toBe(
      SCAN_TIMINGS.compositionDebounceMs,
    );
  });

  it("returns formatDebounceMs for formatBold", () => {
    expect(resolveAdaptiveDebounceMs("formatBold")).toBe(
      SCAN_TIMINGS.formatDebounceMs,
    );
  });

  it("returns autoRefreshDebounceMs for unknown inputType", () => {
    expect(resolveAdaptiveDebounceMs("someUnknownType")).toBe(
      SCAN_TIMINGS.autoRefreshDebounceMs,
    );
  });
});
