"use client";

import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export function ReviewForm({
  productId,
  onSubmitted,
}: {
  productId: string;
  onSubmitted?: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("product");
  const tc = useTranslations("common");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || undefined,
          comment,
        }),
      });
      if (res.ok) {
        toast.success(t("reviewSubmitted"));
        setTitle("");
        setComment("");
        setRating(5);
        if (onSubmitted) onSubmitted();
        else window.location.reload();
      } else if (res.status === 401) {
        window.location.href = `/${locale}/auth/login`;
      } else {
        const d = await res.json();
        toast.error(d.error || tc("error"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h3 className="mb-1 text-lg font-bold">{t("writeReview")}</h3>
      <p className="mb-4 text-sm text-slate-500">{t("beFirstReview")}</p>
      <div className="mb-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n}/5`}
            onClick={() => setRating(n)}
            className={`text-3xl transition-transform hover:scale-110 ${
              n <= rating ? "text-amber-400" : "text-slate-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        className="mb-3"
        aria-label={t("reviewTitle")}
        placeholder={t("reviewTitlePlaceholder")}
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
        minLength={10}
        rows={4}
        className="w-full rounded-lg border border-slate-200 p-3 text-sm"
        placeholder={t("reviewPlaceholder")}
      />
      <Button type="submit" className="mt-3" disabled={loading}>
        {tc("submit")}
      </Button>
    </form>
  );
}
