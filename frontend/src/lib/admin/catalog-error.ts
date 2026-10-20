export function formatFieldErrors(errors: unknown, prefix = ""): string {
  if (errors == null) return "";
  if (typeof errors === "string") return prefix ? `${prefix}: ${errors}` : errors;
  if (Array.isArray(errors)) {
    const allStrings = errors.every((item) => typeof item === "string");
    if (allStrings) {
      return errors
        .map((item) => (prefix ? `${prefix}: ${item}` : item))
        .join(" · ");
    }
    return errors
      .map((item, index) => formatFieldErrors(item, prefix ? `${prefix}.${index}` : String(index)))
      .filter(Boolean)
      .join(" · ");
  }
  if (typeof errors === "object") {
    return Object.entries(errors as Record<string, unknown>)
      .map(([key, value]) => formatFieldErrors(value, prefix ? `${prefix}.${key}` : key))
      .filter(Boolean)
      .join(" · ");
  }
  return "";
}

export function catalogErrorMessage(
  data: { error?: string; errors?: unknown },
  skuExists: string,
  fallback: string,
) {
  if (data.error === "SKU already exists") return skuExists;
  const details = formatFieldErrors(data.errors);
  if (details) return `${data.error || fallback} — ${details}`;
  return data.error || fallback;
}
