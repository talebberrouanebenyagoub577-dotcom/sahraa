"use client";

import { apiFetch } from "@/lib/api";
import { useCart } from "@/lib/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { MessageCircleQuestion, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RelatedCard {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  price: number;
  image?: string | null;
}

const SUGGESTION_KEYS = [
  "qName",
  "qPrice",
  "qWhat",
  "qHow",
  "qWho",
  "qIngredients",
  "qResults",
  "qSensitive",
] as const;

export function ProductAssistant({
  productId,
  slug,
  name,
  nameAr,
  price,
  image,
}: {
  productId: string;
  slug: string;
  name: string;
  nameAr: string;
  price: number;
  image?: string;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("ai");
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [related, setRelated] = useState<RelatedCard[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: t("productGreeting", { name: isAr ? nameAr : name }) },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, related]);

  const ask = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;
    setInput("");
    setRelated([]);
    setMessages((current) => [...current, { role: "user", content: message }]);
    setLoading(true);
    try {
      const history = messages.slice(-6).map((item) => ({
        role: item.role,
        content: item.content,
      }));
      const res = await apiFetch("/api/ai/product-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, message, locale: isAr ? "ar" : "en", history }),
      });
      const body = await res.json();
      if (!res.ok || body.success === false) {
        if (res.status === 404) {
          setUnavailable(true);
          setMessages((current) => [...current, { role: "assistant", content: t("productUnavailable") }]);
          return;
        }
        setMessages((current) => [...current, { role: "assistant", content: t("productError") }]);
        return;
      }
      setMessages((current) => [
        ...current,
        { role: "assistant", content: body.data?.response || t("productError") },
      ]);
      setRelated(Array.isArray(body.data?.related) ? body.data.related : []);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: t("productError") }]);
    } finally {
      setLoading(false);
    }
  };

  const addCurrent = () => {
    addItem({ id: productId, name, nameAr, slug, image, price });
    toast.success(t("addedToCart"));
  };

  const addRelated = (item: RelatedCard) => {
    addItem({
      id: item.id,
      name: item.name,
      nameAr: item.nameAr,
      slug: item.slug,
      image: item.image || undefined,
      price: item.price,
    });
    toast.success(t("addedToCart"));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 end-5 z-40 flex items-center gap-2 rounded-full bg-amber-500 px-4 py-3 text-sm font-bold text-black shadow-lg hover:bg-amber-400 sm:bottom-6 sm:end-6"
      >
        <MessageCircleQuestion className="h-5 w-5" />
        <span>{t("askAboutProduct")}</span>
      </button>

      {open && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 flex h-[86vh] max-h-[720px] flex-col overflow-hidden rounded-t-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl sm:inset-x-auto sm:bottom-24 sm:end-6 sm:h-[560px] sm:w-[400px] sm:rounded-2xl"
          role="dialog"
          aria-label={t("askAboutProduct")}
        >
          <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">{t("askAboutProduct")}</h3>
              <p className="text-xs text-slate-400">{isAr ? nameAr : name}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-200 hover:bg-slate-800" aria-label={t("close")}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-900 p-4">
            {unavailable && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-slate-100">{t("productUnavailable")}</p>
            )}
            {messages.map((msg, index) => (
              <div key={`${msg.role}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-6 ${
                    msg.role === "user" ? "bg-amber-500 text-white" : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && <p className="text-sm text-slate-300">{t("thinking")}</p>}
            {related.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-200">{t("relatedHint")}</p>
                {related.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-800 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{isAr ? item.nameAr : item.name}</p>
                      <p className="text-xs text-slate-300">{formatPrice(item.price, "SAR", locale)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addRelated(item)}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-black"
                    >
                      {t("addToCart")}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-700 bg-slate-900 p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {SUGGESTION_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => ask(t(key))}
                  className="rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-[11px] text-slate-200"
                >
                  {t(key)}
                </button>
              ))}
            </div>
            <div className="mb-2 flex justify-end">
              <button type="button" onClick={addCurrent} className="text-xs font-bold text-slate-200 underline">
                {t("addCurrentToCart")}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && ask(input)}
                placeholder={t("productPlaceholder")}
                className="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => ask(input)}
                disabled={loading || !input.trim()}
                className="rounded-lg bg-amber-500 px-3 text-black disabled:opacity-50"
                aria-label={t("send")}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
