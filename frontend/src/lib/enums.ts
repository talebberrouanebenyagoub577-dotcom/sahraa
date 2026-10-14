export const Currency = {
  SAR: "SAR",
  AED: "AED",
  KWD: "KWD",
  QAR: "QAR",
  BHD: "BHD",
  OMR: "OMR",
} as const;
export type Currency = (typeof Currency)[keyof typeof Currency];

export const CountryCode = {
  SA: "SA",
  AE: "AE",
  KW: "KW",
  QA: "QA",
  BH: "BH",
  OM: "OM",
} as const;
export type CountryCode = (typeof CountryCode)[keyof typeof CountryCode];

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "SELLER" | "CUSTOMER" | "SUPPORT_AGENT";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED";
