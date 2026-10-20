import { apiBase } from "@/lib/api";

export function mediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  if (url.startsWith("/uploads/")) {
    const base = apiBase();
    return base ? `${base}${url}` : url;
  }
  return url;
}
