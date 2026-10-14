export interface UpsellRecommendation {
  slug: string;
  pitchAr: string;
  pitchEn: string;
  priorityAffinity: string[]; // Slugs of products that trigger this upsell
}

/**
 * Intelligent pairing matrix designed for high conversion and product synergy:
 * - Skincare serums pair with eye lift, peel shot, or vitamin serums.
 * - Hair treatments pair with hair concealer / thickening.
 * - Muscle/pain relief pairs with EMS foot mat.
 * - Perfumes pair together or with luxury beauty.
 */
export const UPSELL_CATALOG_META: Record<string, UpsellRecommendation> = {
  "harvey-ross-instant-eye-lift": {
    slug: "harvey-ross-instant-eye-lift",
    pitchAr: "سيروم العيون الفوري للتجاعيد والهالات — الإضافة المثالية لروتينك لنضارة وشد فوري متكامل.",
    pitchEn: "Instant eye lift serum for wrinkles & dark circles — perfect synergy with your current selection.",
    priorityAffinity: [
      "deep-cera-vitamin-illuminating-serum",
      "dr-melaxin-peel-shot",
      "al-asmad-alharmain-kohl",
      "booty-gainer-pro-series",
    ],
  },
  "deep-cera-vitamin-illuminating-serum": {
    slug: "deep-cera-vitamin-illuminating-serum",
    pitchAr: "سيروم الفيتامين ديب سيرا لتفتيح ونضارة فائقة للبشرة — العرض الأكثر طلباً وتكاملاً.",
    pitchEn: "DEEP CERA Vitamin Illuminating Serum for radiant skin — top-requested bundle add-on.",
    priorityAffinity: [
      "harvey-ross-instant-eye-lift",
      "dr-melaxin-peel-shot",
      "women-perfume-trio-la-vita-sbela-mi-way-ideal",
      "booty-gainer-pro-series",
    ],
  },
  "dr-melaxin-peel-shot": {
    slug: "dr-melaxin-peel-shot",
    pitchAr: "مقشر دكتور ميلاكسين لتنقية المسام وتجديد خلايا الوجه بعمق وسرعة.",
    pitchEn: "Dr. Melaxin Peel Shot for deep pore cleansing and facial renewal.",
    priorityAffinity: [
      "deep-cera-vitamin-illuminating-serum",
      "harvey-ross-instant-eye-lift",
    ],
  },
  "hair-concealer-fuller-hair-look": {
    slug: "hair-concealer-fuller-hair-look",
    pitchAr: "مصحح ومكثف فراغات الشعر الفوري لمظهر شبابي وممتلئ في ثوانٍ معدودة.",
    pitchEn: "Instant Hair Concealer for a fuller, youthful look in seconds.",
    priorityAffinity: [
      "eelhoe-hair-darkening-spray",
      "al-asmad-alharmain-kohl",
    ],
  },
  "eelhoe-hair-darkening-spray": {
    slug: "eelhoe-hair-darkening-spray",
    pitchAr: "بخاخ إيلهو الطبيعي لتسويد وتغذية بصيلات الشعر واستعادة شبابه ولمعانه.",
    pitchEn: "EELHOE Hair Darkening Spray to naturally nourish roots and restore youthful tone.",
    priorityAffinity: [
      "hair-concealer-fuller-hair-look",
    ],
  },
  "capsicum-pain-relief-cream": {
    slug: "capsicum-pain-relief-cream",
    pitchAr: "كريم الكابسيسين المركز لتسكين فوري لآلام المفاصل والعضلات وأسفل الظهر.",
    pitchEn: "Concentrated Capsicum Pain Relief Cream for rapid muscle and joint relief.",
    priorityAffinity: [
      "ems-foot-massager-mat",
      "car-battery-remote-disconnect-switch",
      "al-matthee-fun-math-game",
    ],
  },
  "ems-foot-massager-mat": {
    slug: "ems-foot-massager-mat",
    pitchAr: "بساط المساج الذكي بتقنية EMS لتنشيط الدورة الدموية وراحة القدمين والسيقان.",
    pitchEn: "Smart EMS Foot Massager Mat to boost circulation and relieve tired legs.",
    priorityAffinity: [
      "capsicum-pain-relief-cream",
      "oswei-disposable-toilet-cleaning-wand",
    ],
  },
  "women-perfume-trio-la-vita-sbela-mi-way-ideal": {
    slug: "women-perfume-trio-la-vita-sbela-mi-way-ideal",
    pitchAr: "مجموعة العطور النسائية الثلاثية الفاخرة — 3 روائح ساحرة تدوم طويلاً بـ 99 ر.س فقط!",
    pitchEn: "Luxury Women Perfume Trio — 3 long-lasting captivating fragrances for only 99 SAR!",
    priorityAffinity: [
      "al-jabrut-assaoudi-50ml",
      "deep-cera-vitamin-illuminating-serum",
      "harvey-ross-instant-eye-lift",
    ],
  },
  "al-jabrut-assaoudi-50ml": {
    slug: "al-jabrut-assaoudi-50ml",
    pitchAr: "عطر الجبروت السعودي الفاخر — ثبات ملكي وفوحان يدوم طوال اليوم.",
    pitchEn: "Al Jabrut Assaoudi Luxury 50ml Perfume — royal persistence and all-day sillage.",
    priorityAffinity: [
      "women-perfume-trio-la-vita-sbela-mi-way-ideal",
      "capsicum-pain-relief-cream",
    ],
  },
  "oswei-disposable-toilet-cleaning-wand": {
    slug: "oswei-disposable-toilet-cleaning-wand",
    pitchAr: "عصا تنظيف المرحاض الذكية مع رؤوس معقمة برائحة منعشة لتنظيف صحي وسهل.",
    pitchEn: "Smart Disposable Toilet Cleaning Wand for hygienic, effortless bathroom care.",
    priorityAffinity: [
      "car-battery-remote-disconnect-switch",
      "al-matthee-fun-math-game",
    ],
  },
};

/**
 * Universal fallback order of best-converting products
 */
export const UNIVERSAL_FALLBACK_SLUGS = [
  "harvey-ross-instant-eye-lift",
  "deep-cera-vitamin-illuminating-serum",
  "capsicum-pain-relief-cream",
  "hair-concealer-fuller-hair-look",
  "ems-foot-massager-mat",
  "women-perfume-trio-la-vita-sbela-mi-way-ideal",
  "eelhoe-hair-darkening-spray",
];

/**
 * Selects the single best upsell product slug based on the customer's current cart.
 * Guarantees that the chosen product is NOT already in the cart.
 */
export function pickSmartUpsellSlug(cartSlugs: string[]): string {
  const cartSet = new Set(cartSlugs.map((s) => s.toLowerCase().trim()));

  // 1. Check direct affinities of products in cart
  for (const slug of cartSlugs) {
    const meta = UPSELL_CATALOG_META[slug];
    if (meta) {
      // Find what other items this item loves to be paired with:
      for (const [candidateSlug, candidateMeta] of Object.entries(UPSELL_CATALOG_META)) {
        if (!cartSet.has(candidateSlug) && candidateMeta.priorityAffinity.includes(slug)) {
          return candidateSlug;
        }
      }
    }
  }

  // 2. Fallback to high-converting bestsellers not in cart
  for (const fallbackSlug of UNIVERSAL_FALLBACK_SLUGS) {
    if (!cartSet.has(fallbackSlug)) {
      return fallbackSlug;
    }
  }

  // 3. Absolute fallback to any candidate not in cart
  for (const slug of Object.keys(UPSELL_CATALOG_META)) {
    if (!cartSet.has(slug)) {
      return slug;
    }
  }

  return "deep-cera-vitamin-illuminating-serum";
}
