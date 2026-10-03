"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export function Newsletter() {
  const t = useTranslations("home");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast.success("✓");
        setEmail("");
      }
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-12">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-2xl font-bold text-white">{t("newsletter")}</h2>
        <p className="mt-2 text-slate-300">{t("newsletterDesc")}</p>
        <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            required
            className="flex-1 border-0"
          />
          <Button type="submit" disabled={loading}>
            {t("subscribe")}
          </Button>
        </form>
      </div>
    </section>
  );
}
