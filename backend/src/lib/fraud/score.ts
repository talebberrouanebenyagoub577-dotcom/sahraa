import { geoForeignAction, geoSaOnly, geoUnknownAction, phoneMaxOrders } from "./config";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type FraudAction = "allow" | "review" | "reject";

export interface FraudSignals {
  shippingCountry: string;
  phoneValid: boolean;
  city: string;
  /** ISO country from GeoIP. Null means unknown, not foreign. */
  geoCountry: string | null;
  geoChecked: boolean;
  blacklisted: boolean;
  phoneOrdersInWindow: number;
  ipOrdersInWindow: number;
  deviceDistinctPhones: number;
  cancelledOrReturned: number;
  userAgent: string;
}

export interface FraudDecision {
  action: FraudAction;
  riskLevel: RiskLevel;
  score: number;
  reasons: string[];
  message: string;
  httpStatus: number;
}

export const REASON_TEXT: Record<string, string> = {
  country_not_sa: "دولة الشحن خارج السعودية",
  invalid_phone: "رقم الجوال غير سعودي أو غير صالح",
  blacklisted: "الرقم في قائمة الحظر بعد إرجاع أو رفض متكرر",
  phone_velocity: "تكرار الطلبات من نفس الجوال خلال وقت قصير",
  rate_limited: "محاولات كثيرة خلال وقت قصير",
  geo_foreign: "عنوان الشبكة يبدو خارج السعودية",
  geo_unknown: "تعذر تحديد دولة الشبكة",
  vague_city: "المدينة غير واضحة",
  shared_device: "نفس الجهاز استخدم أرقاماً متعددة بسرعة",
  ip_velocity: "تكرار ملحوظ من نفس الشبكة",
  return_history: "سجل إلغاء أو إرجاع متكرر لهذا الجوال",
  bot_ua: "سلوك يشبه الطلبات الآلية",
};

const VAGUE_CITIES = new Set(["", "مدينة أخرى", "اخرى", "أخرى", "other", "na", "n/a"]);

export function isVagueCity(city: string): boolean {
  const value = city.trim().toLowerCase();
  return value.length < 2 || VAGUE_CITIES.has(city.trim()) || VAGUE_CITIES.has(value);
}

function levelFor(score: number): RiskLevel {
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

/**
 * Hard rejects are limited to shipping country, the phone itself, a blacklist
 * hit, or repeated orders from that phone. GeoIP alone never rejects unless
 * GEOIP_FOREIGN_ACTION=block, and an unknown lookup never rejects.
 */
export function decideFraud(signals: FraudSignals): FraudDecision {
  const reasons: string[] = [];
  const country = signals.shippingCountry.trim().toUpperCase();

  if (country !== "SA") {
    return reject("country_not_sa", "التوصيل متاح داخل المملكة العربية السعودية فقط.", 400);
  }
  if (!signals.phoneValid) {
    return reject("invalid_phone", "أدخل رقم جوال سعودي صحيح، مثل 05xxxxxxxx.", 400);
  }
  if (signals.blacklisted) {
    return reject("blacklisted", "لا يمكن إتمام هذا الطلب. تواصل مع خدمة العملاء إذا كان الرقم لك.", 403);
  }
  if (signals.phoneOrdersInWindow >= phoneMaxOrders()) {
    return reject(
      "phone_velocity",
      "استلمنا طلباً من هذا الجوال قبل قليل. انتظر قليلاً ثم أعد المحاولة إذا لم يصلك التأكيد.",
      429
    );
  }

  let score = 0;
  const geo = signals.geoCountry?.trim().toUpperCase() || null;
  const foreign = Boolean(geo && geo !== "SA");
  const unknownGeo = signals.geoChecked && !geo;

  if (foreign && geoSaOnly()) {
    score += 30;
    reasons.push("geo_foreign");
  } else if (unknownGeo && geoUnknownAction() === "review") {
    score += 25;
    reasons.push("geo_unknown");
  }

  if (isVagueCity(signals.city)) {
    score += 25;
    reasons.push("vague_city");
  }
  if (signals.deviceDistinctPhones >= 4) {
    score += 25;
    reasons.push("shared_device");
  }
  if (signals.ipOrdersInWindow >= 10) {
    score += 15;
    reasons.push("ip_velocity");
  }
  if (signals.cancelledOrReturned >= 2) {
    score += 30;
    reasons.push("return_history");
  }
  if (/bot|spider|crawl|wget|python-requests|scrapy|headless/i.test(signals.userAgent)) {
    score += 20;
    reasons.push("bot_ua");
  }

  if (foreign && geoSaOnly() && geoForeignAction() === "block") {
    return reject("geo_foreign", "لا يمكن إتمام الطلب من خارج المملكة العربية السعودية.", 403);
  }

  const riskLevel = levelFor(score);
  if (riskLevel === "HIGH") {
    return {
      action: "review",
      riskLevel,
      score,
      reasons,
      message: "تم استلام طلبك وهو قيد المراجعة قبل التجهيز.",
      httpStatus: 201,
    };
  }
  if (riskLevel === "MEDIUM") {
    return {
      action: "review",
      riskLevel,
      score,
      reasons,
      message: "تم استلام طلبك. قد يتصل بك الفريق لتأكيده قبل الشحن.",
      httpStatus: 201,
    };
  }
  return {
    action: "allow",
    riskLevel: "LOW",
    score,
    reasons,
    message: "",
    httpStatus: 201,
  };
}

function reject(reason: string, message: string, httpStatus: number): FraudDecision {
  return {
    action: "reject",
    riskLevel: "HIGH",
    score: 100,
    reasons: [reason],
    message,
    httpStatus,
  };
}

export function reasonSummary(reasons: string[]): string {
  return reasons.map((reason) => REASON_TEXT[reason] || reason).join("، ");
}

export const RATE_LIMIT_MESSAGE = "محاولات كثيرة خلال وقت قصير. حاول مرة أخرى بعد قليل.";
