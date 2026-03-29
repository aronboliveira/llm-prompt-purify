/**
 * Content Purification Service Tests
 *
 * Comprehensive test suite for XSS, XXE, SQL injection, and path traversal
 * detection and neutralization.
 */

import {
  ContentPurifier,
  detectThreats,
  hasThreats,
  purifyContent,
} from "@core/purification/purification.service";
import { containsSqlInjection, detectSqlInjection } from "@core/purification/utils/sql-detect.utils";
import { containsXss, detectXssPatterns, encodeHtmlEntities } from "@core/purification/utils/xss-purify.utils";
import { containsXxe, detectXxe } from "@core/purification/utils/xxe-detect.utils";
import {
  containsPathTraversal,
  detectPathTraversal,
  wouldEscapeBase,
} from "@core/purification/utils/path-traversal.utils";

describe("ContentPurifier", () => {
  let purifier: ContentPurifier;

  beforeEach(() => {
    purifier = new ContentPurifier();
  });

  describe("XSS Detection", () => {
    it("detects script tag injection", () => {
      const text = '<script>alert("xss")</script>';
      const result = purifier.detect(text);

      expect(result.length).toBeGreaterThan(0);
      expect(result.some(t => t.type === "xss")).toBe(true);
      expect(result.some(t => t.ruleId === "xss-script-tag")).toBe(true);
    });

    it("detects event handler injection", () => {
      const text = '<img onerror="alert(1)" src="x">';
      const result = purifier.detect(text);

      expect(result.some(t => t.ruleId === "xss-onerror")).toBe(true);
    });

    it("detects javascript: protocol", () => {
      const text = '<a href="javascript:alert(1)">Click</a>';
      const result = purifier.detect(text);

      expect(result.some(t => t.ruleId === "xss-javascript-proto")).toBe(true);
    });

    it("detects iframe injection", () => {
      const text = '<iframe src="https://evil.com"></iframe>';
      const result = purifier.detect(text);

      expect(result.some(t => t.ruleId === "xss-iframe")).toBe(true);
    });

    it("containsXss returns true for malicious content", () => {
      expect(containsXss('<script>evil()</script>')).toBe(true);
      expect(containsXss('<img onerror="alert(1)">')).toBe(true);
      expect(containsXss("javascript:void(0)")).toBe(true);
    });

    it("containsXss returns false for safe content", () => {
      expect(containsXss("Hello world")).toBe(false);
      expect(containsXss("<p>Safe paragraph</p>")).toBe(false);
    });

    it("encodes HTML entities correctly", () => {
      expect(encodeHtmlEntities("<script>")).toBe("&lt;script&gt;");
      expect(encodeHtmlEntities('"quoted"')).toBe("&quot;quoted&quot;");
      expect(encodeHtmlEntities("a & b")).toBe("a &amp; b");
    });
  });

  describe("SQL Injection Detection", () => {
    it("detects OR-based injection", () => {
      const text = "SELECT * FROM users WHERE id=1 OR '1'='1'";
      const result = purifier.detect(text);

      expect(result.some(t => t.type === "sql-injection")).toBe(true);
    });

    it("detects UNION SELECT", () => {
      const text = "1 UNION SELECT username, password FROM users";
      const result = purifier.detect(text);

      expect(result.some(t => t.ruleId === "sqli-union-select")).toBe(true);
    });

    it("detects stacked queries", () => {
      const text = "1; DROP TABLE users;--";
      const result = purifier.detect(text);

      expect(result.some(t => t.ruleId === "sqli-stacked")).toBe(true);
    });

    it("detects time-based blind injection", () => {
      const text = "1 AND SLEEP(5)";
      const result = purifier.detect(text);

      expect(result.some(t => t.ruleId === "sqli-time-delay")).toBe(true);
    });

    it("containsSqlInjection returns true for attacks", () => {
      expect(containsSqlInjection("' OR '1'='1")).toBe(true);
      expect(containsSqlInjection("1; DROP TABLE users")).toBe(true);
      expect(containsSqlInjection("UNION SELECT password FROM users")).toBe(true);
    });

    it("containsSqlInjection returns false for safe queries", () => {
      expect(containsSqlInjection("John Smith")).toBe(false);
      expect(containsSqlInjection("email@example.com")).toBe(false);
    });
  });

  describe("XXE Detection", () => {
    it("detects DOCTYPE with SYSTEM entity", () => {
      const xml = `<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>`;
      const result = purifier.detect(xml);

      expect(result.some(t => t.type === "xxe")).toBe(true);
    });

    it("detects external DTD reference", () => {
      const xml = '<!DOCTYPE foo SYSTEM "https://evil.com/evil.dtd">';
      const result = purifier.detect(xml);

      expect(result.some(t => t.ruleId === "xxe-external-dtd")).toBe(true);
    });

    it("detects file:// protocol", () => {
      const text = "file:///etc/passwd";
      const result = purifier.detect(text);

      expect(result.some(t => t.ruleId === "xxe-file-proto")).toBe(true);
    });

    it("detects XInclude", () => {
      const xml =
        '<xi:include href="file:///etc/passwd" xmlns:xi="http://www.w3.org/2001/XInclude"/>';
      const result = purifier.detect(xml);

      expect(result.some(t => t.type === "xxe")).toBe(true);
    });

    it("containsXxe returns true for malicious XML", () => {
      expect(containsXxe("<!ENTITY xxe SYSTEM 'file:///etc/passwd'>")).toBe(true);
      expect(containsXxe("file:///etc/passwd")).toBe(true);
    });
  });

  describe("Path Traversal Detection", () => {
    it("detects Unix path traversal", () => {
      const path = "../../../etc/passwd";
      const result = purifier.detect(path);

      expect(result.some(t => t.type === "path-traversal")).toBe(true);
    });

    it("detects Windows path traversal", () => {
      const path = "..\\..\\..\\windows\\system32";
      const result = purifier.detect(path);

      expect(result.some(t => t.type === "path-traversal")).toBe(true);
    });

    it("detects URL-encoded traversal", () => {
      const path = "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd";
      const result = purifier.detect(path);

      // Should detect either encoded traversal or generic path traversal
      expect(result.some(t => t.type === "path-traversal")).toBe(true);
    });

    it("containsPathTraversal returns true for attacks", () => {
      expect(containsPathTraversal("../../../etc/passwd")).toBe(true);
      expect(containsPathTraversal("..\\..\\boot.ini")).toBe(true);
    });

    it("wouldEscapeBase correctly identifies escapes", () => {
      expect(wouldEscapeBase("../../file.txt")).toBe(true);
      expect(wouldEscapeBase("./file.txt")).toBe(false);
      expect(wouldEscapeBase("subdir/file.txt")).toBe(false);
      expect(wouldEscapeBase("subdir/../file.txt")).toBe(false);
    });
  });

  describe("purify()", () => {
    it("returns sanitized text and threat list", () => {
      const text = '<script>alert("xss")</script>';
      const result = purifier.purify(text);

      expect(result.hasThreats).toBe(true);
      expect(result.threats.length).toBeGreaterThan(0);
      expect(result.purifiedText).not.toContain("<script>");
    });

    it("counts threats by type", () => {
      const text =
        '<script>alert(1)</script> AND 1=1; DROP TABLE users--';
      const result = purifier.purify(text);

      expect(result.threatCounts.xss).toBeGreaterThan(0);
      expect(result.threatCounts["sql-injection"]).toBeGreaterThan(0);
    });

    it("strips threats when stripThreats is true", () => {
      const text = 'Before <script>evil</script> Safe content after';
      const result = purifier.purify(text, { stripThreats: true, encodeHtml: false });

      expect(result.purifiedText).not.toContain("<script>");
      // Note: Adjacent text may be affected when stripping overlapping threats
      expect(result.purifiedText).toContain("Before");
      expect(result.purifiedText).toContain("after");
    });

    it("encodes HTML when encodeHtml is true", () => {
      const text = "<p>Test</p>";
      const result = purifier.purify(text, { encodeHtml: true, stripThreats: false });

      expect(result.purifiedText).toContain("&lt;p&gt;");
    });
  });

  describe("purifyContent() standalone function", () => {
    it("works without Angular DI", () => {
      const result = purifyContent('<script>xss</script>');

      expect(result.hasThreats).toBe(true);
      expect(result.threats.some(t => t.type === "xss")).toBe(true);
    });
  });

  describe("detectThreats() standalone function", () => {
    it("detects all threat types", () => {
      const multiThreat =
        '<script>xss</script> UNION SELECT * file:///etc/passwd ../../etc';
      const threats = detectThreats(multiThreat);

      expect(threats.some(t => t.type === "xss")).toBe(true);
      expect(threats.some(t => t.type === "sql-injection")).toBe(true);
      expect(threats.some(t => t.type === "xxe")).toBe(true);
      expect(threats.some(t => t.type === "path-traversal")).toBe(true);
    });
  });

  describe("hasThreats() standalone function", () => {
    it("returns true when threats exist", () => {
      expect(hasThreats('<script>alert(1)</script>')).toBe(true);
      expect(hasThreats("UNION SELECT password")).toBe(true);
    });

    it("returns false for safe content", () => {
      expect(hasThreats("Hello, world!")).toBe(false);
      expect(hasThreats("user@example.com")).toBe(false);
    });
  });

  describe("purifyForLlm()", () => {
    it("purifies content for LLM without HTML encoding", () => {
      const text = '<script>alert(1)</script>Ask about API keys';
      const result = purifier.purifyForLlm(text);

      expect(result.hasThreats).toBe(true);
      // Should not encode HTML for LLM readability
      expect(result.purifiedText).not.toContain("&lt;");
    });
  });

  describe("Real-world scenarios", () => {
    it("handles mixed content with sensitive data", () => {
      const content = `
        User email: john@example.com
        <script>document.cookie</script>
        Query: SELECT * FROM users WHERE email='john@example.com'
      `;
      const result = purifier.purify(content);

      expect(result.hasThreats).toBe(true);
      expect(result.threats.some(t => t.type === "xss")).toBe(true);
    });

    it("handles legitimate SQL-like content cautiously", () => {
      const content = "The user typed 'SELECT' in the search box";
      const result = purifier.purify(content);

      // Should not false positive on mere keyword presence
      expect(
        result.threats.filter(t => t.severity === "critical").length,
      ).toBe(0);
    });

    it("handles legitimate XML without XXE", () => {
      const xml = `<?xml version="1.0"?>
<note>
  <to>User</to>
  <body>Hello</body>
</note>`;
      const result = purifier.purify(xml);

      // No XXE threats in simple XML
      expect(result.threats.filter(t => t.type === "xxe").length).toBe(0);
    });
  });
});
