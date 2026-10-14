"use client";

import { useEffect } from "react";
import { trackViewContent } from "@/lib/tracking/browser";

export function ViewContentTracker({ id, name, value }: { id: string; name: string; value: number }) {
  useEffect(() => {
    trackViewContent({ id, name, value });
  }, [id, name, value]);
  return null;
}
