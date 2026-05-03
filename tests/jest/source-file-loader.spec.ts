import {
  loadSourceFile,
  type SourceFileLoadResult,
} from "@features/scanner/utils/source-file-loader.utils";

// Polyfill File.prototype.text for jsdom <21 (bundled with Jest 29)
beforeAll(() => {
  if (!File.prototype.text) {
    Object.defineProperty(File.prototype, "text", {
      value(): Promise<string> {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsText(this);
        });
      },
      writable: true,
      configurable: true,
    });
  }
});

describe("loadSourceFile", () => {
  it("accepts a valid .txt file with text/plain MIME type", async () => {
    const file = new File(["Hello world"], "test.txt", { type: "text/plain" });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fileName).toBe("test.txt");
      expect(result.text).toBe("Hello world");
      expect(result.threatCount).toBe(0);
      expect(result.threatTypes).toHaveLength(0);
    }
  });

  it("accepts a valid .log file", async () => {
    const file = new File(["Error: connection refused"], "server.log", {
      type: "text/x-log",
    });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(true);
  });

  it("accepts a file with empty MIME type", async () => {
    const file = new File(["plain content"], "notes.txt", { type: "" });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(true);
  });

  it("rejects a file with disallowed extension (.pdf)", async () => {
    const file = new File(["content"], "doc.pdf", { type: "text/plain" });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("extension");
      expect(result.message).toContain("Only .txt and .log files");
    }
  });

  it("rejects a file with disallowed extension (.exe)", async () => {
    const file = new File(["content"], "malware.exe", {
      type: "application/octet-stream",
    });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("extension");
    }
  });

  it("rejects a file with disallowed MIME type", async () => {
    const file = new File(["content"], "data.txt", { type: "application/json" });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("mime");
      expect(result.message).toContain("application/json");
    }
  });

  it("rejects a file that exceeds SOURCE_FILE_MAX_BYTES (1 MB)", async () => {
    const largeContent = "x".repeat(1_048_577);
    const file = new File([largeContent], "big.txt", { type: "text/plain" });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("size");
      expect(result.message).toContain("File is larger than");
      expect(result.message).toContain("1024 KB");
    }
  });

  it("accepts a file at exactly SOURCE_FILE_MAX_BYTES", async () => {
    const maxContent = "x".repeat(1_048_576);
    const file = new File([maxContent], "max.txt", { type: "text/plain" });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(true);
  });

  it("rejects an empty file (size 0)", async () => {
    const file = new File([], "empty.txt", { type: "text/plain" });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("empty");
      expect(result.message).toContain("empty");
    }
  });

  it("rejects a file that contains null bytes (binary)", async () => {
    const binaryContent = "Hello\x00World";
    const file = new File([binaryContent], "binary.txt", {
      type: "text/plain",
    });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("binary");
      expect(result.message).toContain("binary data");
    }
  });

  it("rejects a file with high ratio of non-printable characters", async () => {
    // 4096 chars, 100 non-printable = ~2.44% which exceeds 2% threshold
    const nonPrintableCount = 100;
    const printableCount = 3996;
    const nonPrintable = String.fromCharCode(14).repeat(nonPrintableCount);
    const printable = "A".repeat(printableCount);
    const content = nonPrintable + printable;
    const file = new File([content], "binary.txt", { type: "text/plain" });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("binary");
    }
  });

  it("accepts a file with a small number of non-printable characters below the threshold", async () => {
    // 4096 chars, 30 non-printable = ~0.73% which is under 2% threshold
    const nonPrintable = String.fromCharCode(14).repeat(30);
    const printable = "A".repeat(4066);
    const content = nonPrintable + printable;
    const file = new File([content], "mostly-text.txt", {
      type: "text/plain",
    });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(true);
  });

  it("reports read failure when file.text() rejects", async () => {
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    // Override text() to simulate a read failure
    jest.spyOn(file, "text").mockRejectedValue(new Error("Read error"));

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("read");
      expect(result.message).toContain("Could not read the file");
    }
  });

  it("detects XSS content and purifies it", async () => {
    const file = new File(
      ['<script>alert(1)</script>Hello world'],
      "test.txt",
      { type: "text/plain" },
    );

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.threatCount).toBeGreaterThan(0);
      // The script tag should be stripped
      expect(result.text).not.toContain("<script>");
      expect(result.text).not.toContain("alert(1)");
      expect(result.text).toContain("Hello world");
      expect(result.threatTypes).toContain("xss");
    }
  });

  it("returns fileName matching the input filename", async () => {
    const file = new File(["Some content"], "production.log", {
      type: "application/x-log",
    });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fileName).toBe("production.log");
    }
  });

  it("returns threatTypes as deduplicated list", async () => {
    // Multiple XSS patterns in one file — all map to "xss" type
    const file = new File(
      ['<script>alert(1)</script><img onerror="alert(2)" src=x>'],
      "test.txt",
      { type: "text/plain" },
    );

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.threatCount).toBeGreaterThan(1);
      // threatTypes should have "xss" only once (deduplicated)
      const xssCount = result.threatTypes.filter(t => t === "xss").length;
      expect(xssCount).toBe(1);
    }
  });

  it("is case-insensitive for file extension matching", async () => {
    const file = new File(["content"], "notes.TXT", { type: "text/plain" });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(true);
  });

  it("rejects files with no extension", async () => {
    const file = new File(["content"], "no-extension", { type: "text/plain" });

    const result = await loadSourceFile(file);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("extension");
    }
  });
});
