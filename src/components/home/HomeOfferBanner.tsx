import { getTranslations } from "next-intl/server";

export async function HomeOfferBanner() {
  const t = await getTranslations("home");

  return (
    <section className="bg-amber-500">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-slate-900 md:py-8">
        <p className="text-sm font-semibold tracking-wide">{t("offerKicker")}</p>
        <h1 className="mt-1 text-2xl font-bold md:text-4xl">{t("offerTitle")}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm md:text-base">{t("offerSubtitle")}</p>
      </div>
    </section>
  );
}
