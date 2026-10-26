export function extractProductSlug(
  slug?: string,
  referer?: string | null
): string | undefined {
  const fromBody = slug?.trim();
  if (fromBody) return fromBody;
  if (!referer) return undefined;
  try {
    const path = referer.includes("://") ? new URL(referer).pathname : referer;
    const match = path.match(/\/products\/([^/?#]+)/);
    if (!match?.[1]) return undefined;
    return decodeURIComponent(match[1]).trim() || undefined;
  } catch {
    return undefined;
  }
}
