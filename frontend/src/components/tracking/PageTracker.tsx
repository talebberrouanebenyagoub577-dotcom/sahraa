"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAttribution, trackPageView } from "@/lib/tracking/browser";

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    captureAttribution();
    trackPageView();
    const flush = () => window.__sahraaFlush?.();
    const idle = window.requestIdleCallback?.(flush);
    const timer = window.setTimeout(flush, 2500);
    window.addEventListener("load", flush);
    return () => {
      if (typeof idle === "number") window.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
      window.removeEventListener("load", flush);
    };
  }, [pathname]);

  return null;
}
