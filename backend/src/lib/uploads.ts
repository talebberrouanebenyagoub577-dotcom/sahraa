import path from "node:path";

const UPLOAD_ROOT = path.resolve(process.cwd(), "public", "uploads");

export const UPLOAD_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

export function resolveUploadPath(pathname: string): string | null {
  if (!pathname.startsWith("/uploads/")) return null;
  const relative = decodeURIComponent(pathname.slice("/uploads/".length));
  if (!relative || relative.includes("\0")) return null;
  if (relative.split(/[/\\]/).some((part) => part === ".." || part === "")) return null;
  const filePath = path.resolve(UPLOAD_ROOT, relative);
  const rootWithSep = UPLOAD_ROOT.endsWith(path.sep) ? UPLOAD_ROOT : UPLOAD_ROOT + path.sep;
  if (filePath !== UPLOAD_ROOT && !filePath.startsWith(rootWithSep)) return null;
  return filePath;
}

export function publicApiOrigin(request: { headers: Headers }): string {
  const configured = (process.env.PUBLIC_API_URL || "").replace(/\/$/, "");
  if (configured) return configured;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return "";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export function publicUploadUrl(request: { headers: Headers }, pathname: string): string {
  const origin = publicApiOrigin(request);
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return origin ? `${origin}${normalized}` : normalized;
}
