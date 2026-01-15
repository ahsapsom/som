const ABSOLUTE_URL_RE = /^[a-z][a-z0-9+.-]*:/i;

export function normalizeImageSrc(input?: string | null): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") || trimmed.startsWith("//")) return trimmed;
  if (ABSOLUTE_URL_RE.test(trimmed)) return trimmed;
  return `/${trimmed}`;
}

export function normalizeOptionalImageSrc(
  input?: string | null,
): string | undefined {
  const normalized = normalizeImageSrc(input);
  return normalized || undefined;
}
