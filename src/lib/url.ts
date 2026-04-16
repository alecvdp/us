// Normalize and validate user-supplied URLs before storing or rendering them
// as <a href>. Returns null for anything that isn't a real http/https URL —
// in particular, javascript:, data:, vbscript:, and file: URIs are rejected.

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function normalizeExternalUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Default to https:// when the user typed a bare hostname like "example.com".
  // Any other scheme (including javascript:, data:, etc.) gets parsed as-is and
  // then rejected unless it's http or https.
  const candidate = /^[a-z][a-z0-9+-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return null;
  return parsed.toString();
}
