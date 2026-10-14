import { ConfirmationState, RiskLevel } from "@prisma/client";
import prisma from "@/lib/prisma";
import { normalizeSaudiPhone } from "@/lib/tracking/phone";
import { fraudEnabled, mediumCanSelfConfirm, phoneWindowMs } from "./config";
import { lookupCountry } from "./geoip";
import { getTrustedClientIp } from "./ip";
import { decideFraud, reasonSummary, type FraudDecision } from "./score";

export interface CheckoutRisk {
  enabled: boolean;
  decision: FraudDecision;
  phoneE164: string | null;
  clientIp?: string;
  geoCountry: string | null;
  confirmationState: ConfirmationState;
  canSelfConfirm: boolean;
}

export async function assessCheckout(input: {
  headers: { get(name: string): string | null };
  shippingCountry: string;
  phoneRaw: string;
  city: string;
  userAgent: string;
  deviceId?: string;
}): Promise<CheckoutRisk> {
  const phone = normalizeSaudiPhone(input.phoneRaw);
  const clientIp = getTrustedClientIp(input.headers);
  if (!fraudEnabled()) {
    const decision = decideFraud({
      shippingCountry: input.shippingCountry,
      phoneValid: Boolean(phone),
      city: input.city,
      geoCountry: null,
      geoChecked: false,
      blacklisted: false,
      phoneOrdersInWindow: 0,
      ipOrdersInWindow: 0,
      deviceDistinctPhones: 0,
      cancelledOrReturned: 0,
      userAgent: "",
    });
    return {
      enabled: false,
      decision,
      phoneE164: phone?.tiktok || null,
      clientIp,
      geoCountry: null,
      confirmationState: decision.action === "allow" ? ConfirmationState.CONFIRMED : ConfirmationState.AWAITING,
      canSelfConfirm: decision.action !== "reject",
    };
  }

  const since = new Date(Date.now() - phoneWindowMs());
  const geo = await lookupCountry(clientIp);
  const phoneValues = phone ? [phone.tiktok, phone.meta] : [];

  const [phoneOrdersInWindow, ipOrdersInWindow, devicePhones, cancelledOrReturned, blacklist] = await Promise.all([
    phone
      ? prisma.order.count({
          where: { phoneE164: phone.tiktok, createdAt: { gte: since }, status: { not: "CANCELLED" } },
        })
      : Promise.resolve(0),
    clientIp
      ? prisma.order.count({
          where: { clientIp, createdAt: { gte: since }, status: { not: "CANCELLED" } },
        })
      : Promise.resolve(0),
    input.deviceId
      ? prisma.order.findMany({
          where: { deviceId: input.deviceId, createdAt: { gte: since } },
          select: { phoneE164: true },
          distinct: ["phoneE164"],
        })
      : Promise.resolve([]),
    phone
      ? prisma.order.count({
          where: { phoneE164: phone.tiktok, status: { in: ["CANCELLED", "RETURNED"] } },
        })
      : Promise.resolve(0),
    phoneValues.length || clientIp
      ? prisma.fraudBlacklist.findFirst({
          where: {
            active: true,
            OR: [
              ...(phoneValues.length ? [{ kind: "phone", value: { in: phoneValues } }] : []),
              ...(clientIp ? [{ kind: "ip", value: clientIp }] : []),
            ],
          },
        })
      : Promise.resolve(null),
  ]);

  const decision = decideFraud({
    shippingCountry: input.shippingCountry,
    phoneValid: Boolean(phone),
    city: input.city,
    geoCountry: geo.country,
    geoChecked: geo.source !== "unroutable",
    blacklisted: Boolean(blacklist),
    phoneOrdersInWindow,
    ipOrdersInWindow,
    deviceDistinctPhones: devicePhones.length,
    cancelledOrReturned,
    userAgent: input.userAgent,
  });

  const confirmationState =
    decision.riskLevel === "HIGH" ? ConfirmationState.REVIEW : ConfirmationState.AWAITING;
  const canSelfConfirm = confirmationState === ConfirmationState.AWAITING && (decision.riskLevel === "LOW" || mediumCanSelfConfirm());

  return {
    enabled: true,
    decision,
    phoneE164: phone?.tiktok || null,
    clientIp,
    geoCountry: geo.country,
    confirmationState,
    canSelfConfirm,
  };
}

export async function recordRejection(input: {
  phoneE164: string | null;
  clientIp?: string;
  geoCountry: string | null;
  shippingCountry: string;
  reason: string;
}): Promise<void> {
  try {
    await prisma.fraudAttempt.create({
      data: {
        phoneE164: input.phoneE164,
        clientIp: input.clientIp,
        geoCountry: input.geoCountry,
        shippingCountry: input.shippingCountry,
        reason: input.reason,
      },
    });
  } catch (error) {
    console.warn("[fraud] could not record rejection", error instanceof Error ? error.name : "");
  }
}

export function holdReason(decision: FraudDecision): string | null {
  if (decision.action === "allow") return null;
  return reasonSummary(decision.reasons);
}

export function riskLevelEnum(level: FraudDecision["riskLevel"]): RiskLevel {
  if (level === "HIGH") return RiskLevel.HIGH;
  if (level === "MEDIUM") return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
}
