"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SiteSettingsData } from "@/lib/context/SettingsContext";
import toast from "react-hot-toast";
import { Save, Upload, Globe, Mail, Phone, MessageCircle } from "lucide-react";

const emptySettings: SiteSettingsData = {
  id: "default",
  siteName: "",
  siteDescription: "",
  siteLogo: null,
  siteFavicon: null,
  domainName: null,
  supportEmail: null,
  supportPhone: null,
  whatsappNumber: null,
  facebookUrl: null,
  tiktokUrl: null,
  snapchatUrl: null,
  instagramUrl: null,
  youtubeUrl: null,
  twitterUrl: null,
};

export default function AdminSettingsPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [form, setForm] = useState<SiteSettingsData>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "favicon" | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setForm(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateField = (key: keyof SiteSettingsData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadFile = async (file: File, type: "logo" | "favicon") => {
    setUploading(type);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await apiFetch("/api/settings/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("uploadFailed"));

      const field = type === "logo" ? "siteLogo" : "siteFavicon";
      setForm((prev) => ({ ...prev, [field]: data.data.url }));
      toast.success(t("fileUploaded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await apiFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("saveFailed"));

      setForm(data.data);
      toast.success(t("settingsSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout type="admin">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="h-64 rounded-xl bg-slate-200" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("siteSettings")}</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="me-2 h-4 w-4" />
          {saving ? t("saving") : tc("save")}
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">{t("generalInfo")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t("siteNameLabel")}</label>
              <Input
                value={form.siteName}
                onChange={(e) => updateField("siteName", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                <Globe className="me-1 inline h-4 w-4" />
                {t("domainNameLabel")}
              </label>
              <Input
                value={form.domainName || ""}
                onChange={(e) => updateField("domainName", e.target.value)}
                placeholder="sahraa.com"
              />
              <p className="mt-1 text-xs text-slate-500">{t("domainHint")}</p>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{t("siteDescriptionLabel")}</label>
              <Textarea
                value={form.siteDescription}
                onChange={(e) => updateField("siteDescription", e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">{t("logoFavicon")}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">{t("siteLogo")}</label>
              <div className="flex items-center gap-4">
                {form.siteLogo ? (
                  <Image
                    src={form.siteLogo}
                    alt="Logo"
                    width={64}
                    height={64}
                    className="rounded-lg border object-contain"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-slate-100 text-slate-400">
                    —
                  </div>
                )}
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile(file, "logo");
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading === "logo"}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="me-2 h-4 w-4" />
                    {uploading === "logo" ? "..." : t("uploadLogo")}
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">{t("siteFavicon")}</label>
              <div className="flex items-center gap-4">
                {form.siteFavicon ? (
                  <Image
                    src={form.siteFavicon}
                    alt="Favicon"
                    width={32}
                    height={32}
                    className="rounded border object-contain"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded border bg-slate-100 text-slate-400">
                    —
                  </div>
                )}
                <div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile(file, "favicon");
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading === "favicon"}
                    onClick={() => faviconInputRef.current?.click()}
                  >
                    <Upload className="me-2 h-4 w-4" />
                    {uploading === "favicon" ? "..." : t("uploadFavicon")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">{t("contactInfo")}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                <Mail className="me-1 inline h-4 w-4" />
                {t("supportEmailLabel")}
              </label>
              <Input
                type="email"
                value={form.supportEmail || ""}
                onChange={(e) => updateField("supportEmail", e.target.value)}
                placeholder="support@sahraa.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                <Phone className="me-1 inline h-4 w-4" />
                {t("supportPhoneLabel")}
              </label>
              <Input
                value={form.supportPhone || ""}
                onChange={(e) => updateField("supportPhone", e.target.value)}
                placeholder="+966 11 000 0000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                <MessageCircle className="me-1 inline h-4 w-4" />
                WhatsApp
              </label>
              <Input
                value={form.whatsappNumber || ""}
                onChange={(e) => updateField("whatsappNumber", e.target.value)}
                placeholder="+966500000000"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">{t("socialMediaLinks")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ["facebookUrl", "Facebook"],
                ["instagramUrl", "Instagram"],
                ["tiktokUrl", "TikTok"],
                ["snapchatUrl", "Snapchat"],
                ["youtubeUrl", "YouTube"],
                ["twitterUrl", "X (Twitter)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">{label}</label>
                <Input
                  type="url"
                  value={form[key] || ""}
                  onChange={(e) => updateField(key, e.target.value)}
                  placeholder={`https://${label.toLowerCase().replace(/[^a-z]/g, "")}.com/...`}
                />
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="me-2 h-4 w-4" />
            {saving ? t("saving") : t("saveSettings")}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
