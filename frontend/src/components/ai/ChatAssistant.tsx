"use client";

import { apiFetch } from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
}

function readProductSlug(pathname: string | null): string {
  return pathname?.match(/\/products\/([^/?#]+)/)?.[1] || "";
}

export function ChatAssistant() {
  const locale = useLocale();
  const pathname = usePathname();
  const isRtl = locale === "ar";
  const productSlug = readProductSlug(pathname);
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const greeting = product
      ? isRtl
        ? `أجاوب فقط من المعلومات المعروضة في صفحة ${product.nameAr || product.name}.`
        : `I only answer from the details shown on the ${product.name} page.`
      : isRtl
        ? "أقدر نعاونك غير بالمعلومات المعروضة في صفحة المنتج."
        : "I can only help with the details shown on a product page.";
    setMessages([{ role: "assistant", content: greeting }]);
  }, [isRtl, product]);

  useEffect(() => {
    if (!productSlug) {
      setProduct(null);
      return;
    }
    let cancelled = false;
    apiFetch(`/api/storefront/products/${encodeURIComponent(productSlug)}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const item = json.data?.product;
        if (!item?.id) return;
        setProduct({
          id: item.id,
          slug: item.slug || productSlug,
          name: item.name || "",
          nameAr: item.nameAr || "",
        });
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      });
    return () => {
      cancelled = true;
    };
  }, [productSlug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (raw?: string) => {
    const userMessage = (raw ?? input).trim();
    if (!userMessage || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    try {
      const res = await apiFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          slug: productSlug || product?.slug || undefined,
          locale: isRtl ? "ar" : "en",
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.data?.response || "..." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isRtl ? "عذراً، حدث خطأ." : "Sorry, an error occurred.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const chips = product
    ? isRtl
      ? ["اسم المنتج", "سعر المنتج"]
      : ["Product name", "Product price"]
    : [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed bottom-24 end-6 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-3 text-white">
            <div>
              <h3 className="font-semibold">
                {isRtl ? "مساعد صحرا" : "SAHRAA Assistant"}
              </h3>
              <p className="text-xs text-slate-400">
                {product ? (isRtl ? product.nameAr || product.name : product.name) : "AI Powered"}
              </p>
            </div>
            <button onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-amber-500 text-white"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-400">
                  ...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-700 p-3">
            {chips.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => sendMessage(chip)}
                    className="rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-[11px] text-slate-200"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={isRtl ? "اكتب رسالتك..." : "Type a message..."}
                className="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Button size="icon" onClick={() => sendMessage()} disabled={loading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
