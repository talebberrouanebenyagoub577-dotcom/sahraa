export type PixelName = "META" | "TIKTOK" | "SNAP";

export function sanitizePixelId(value: string | undefined | null): string {
  const id = (value || "").trim();
  return id && /^[A-Za-z0-9_-]+$/.test(id) ? id : "";
}

function readEnv(name: string): string {
  const env = process.env;
  return sanitizePixelId(env[name]);
}

function publicPixelEnv(suffix: string): string {
  return readEnv(["NEXT_PUBLIC", suffix].join("_")) || readEnv(suffix);
}

export function runtimePixelIds() {
  return {
    META: publicPixelEnv("META_PIXEL_ID"),
    TIKTOK: publicPixelEnv("TIKTOK_PIXEL_ID"),
    SNAP: publicPixelEnv("SNAP_PIXEL_ID"),
  };
}

export function metaPixelBootstrap(pixelId: string): string {
  const id = sanitizePixelId(pixelId);
  if (!id) return "";
  const quoted = JSON.stringify(id);
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');window.__SAHRAA_PIXELS=Object.assign(window.__SAHRAA_PIXELS||{},{META:${quoted}});fbq('init',${quoted});fbq('track','PageView');`;
}

export function injectedPixelId(name: PixelName): string {
  if (typeof window === "undefined") return "";
  const bag = window.__SAHRAA_PIXELS;
  return sanitizePixelId(bag?.[name]);
}

declare global {
  interface Window {
    __SAHRAA_PIXELS?: Partial<Record<PixelName, string>>;
  }
}
