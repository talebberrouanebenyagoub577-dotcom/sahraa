"use client";

import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

export function ProductShareButton({ title }: { title: string }) {
  const t = useTranslations("product");

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t("linkCopied"));
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") {
        toast.error(t("shareFailed"));
      }
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label={t("shareProduct")}
      className="rounded-full border border-slate-200 bg-white/90 p-2.5 shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <Share2 className="h-5 w-5" />
    </button>
  );
}
