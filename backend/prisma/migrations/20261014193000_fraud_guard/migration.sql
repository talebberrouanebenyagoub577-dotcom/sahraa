-- Fraud guard: risk, confirmation, OTP, and blocked-attempt log.
-- Existing orders stay CONFIRMED so historical COD orders are not reopened.

CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "ConfirmationState" AS ENUM ('AWAITING', 'REVIEW', 'CONFIRMED', 'REJECTED');

ALTER TABLE "Order" ADD COLUMN "attribution" JSONB;
ALTER TABLE "Order" ADD COLUMN "riskScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW';
ALTER TABLE "Order" ADD COLUMN "riskReasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Order" ADD COLUMN "confirmationState" "ConfirmationState" NOT NULL DEFAULT 'CONFIRMED';
ALTER TABLE "Order" ADD COLUMN "phoneE164" TEXT;
ALTER TABLE "Order" ADD COLUMN "geoCountry" TEXT;
ALTER TABLE "Order" ADD COLUMN "clientIp" TEXT;
ALTER TABLE "Order" ADD COLUMN "deviceId" TEXT;
ALTER TABLE "Order" ADD COLUMN "holdReason" TEXT;

CREATE INDEX "Order_phoneE164_createdAt_idx" ON "Order"("phoneE164", "createdAt");
CREATE INDEX "Order_clientIp_createdAt_idx" ON "Order"("clientIp", "createdAt");
CREATE INDEX "Order_confirmationState_idx" ON "Order"("confirmationState");
CREATE INDEX "Order_riskLevel_idx" ON "Order"("riskLevel");

CREATE TABLE "OrderOtp" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "verifiedAt" TIMESTAMP(3),
  "delivery" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderOtp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderOtp_orderId_key" ON "OrderOtp"("orderId");
ALTER TABLE "OrderOtp" ADD CONSTRAINT "OrderOtp_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "FraudBlacklist" (
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FraudBlacklist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FraudBlacklist_kind_value_key" ON "FraudBlacklist"("kind", "value");

CREATE TABLE "FraudAttempt" (
  "id" TEXT NOT NULL,
  "phoneE164" TEXT,
  "clientIp" TEXT,
  "geoCountry" TEXT,
  "shippingCountry" TEXT,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FraudAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FraudAttempt_createdAt_idx" ON "FraudAttempt"("createdAt");
CREATE INDEX "FraudAttempt_phoneE164_idx" ON "FraudAttempt"("phoneE164");
