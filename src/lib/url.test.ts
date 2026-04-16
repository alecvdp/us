import { describe, expect, it } from "vitest";
import { normalizeExternalUrl } from "./url";

describe("normalizeExternalUrl", () => {
  it("returns null for empty / whitespace-only input", () => {
    expect(normalizeExternalUrl("")).toBeNull();
    expect(normalizeExternalUrl("   ")).toBeNull();
  });

  it("prepends https:// to a bare hostname", () => {
    expect(normalizeExternalUrl("example.com")).toBe("https://example.com/");
    expect(normalizeExternalUrl("example.com/path")).toBe(
      "https://example.com/path",
    );
  });

  it("preserves http:// and https:// URLs", () => {
    expect(normalizeExternalUrl("http://example.com")).toBe(
      "http://example.com/",
    );
    expect(normalizeExternalUrl("https://example.com/path?q=1")).toBe(
      "https://example.com/path?q=1",
    );
  });

  it("rejects javascript: URIs (the canonical XSS vector for href)", () => {
    expect(normalizeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeExternalUrl("JAVASCRIPT:alert(1)")).toBeNull();
    expect(normalizeExternalUrl("  javascript:alert(1)  ")).toBeNull();
  });

  it("rejects data: URIs", () => {
    expect(
      normalizeExternalUrl("data:text/html,<script>alert(1)</script>"),
    ).toBeNull();
  });

  it("rejects other non-http schemes", () => {
    expect(normalizeExternalUrl("file:///etc/passwd")).toBeNull();
    expect(normalizeExternalUrl("vbscript:msgbox(1)")).toBeNull();
    expect(normalizeExternalUrl("ftp://example.com")).toBeNull();
    expect(normalizeExternalUrl("mailto:test@example.com")).toBeNull();
  });

  it("rejects unparseable input", () => {
    expect(normalizeExternalUrl("http://")).toBeNull();
  });
});
