-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'AWAITING_RECEIPT', 'RECEIVED', 'REFUNDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReturnShippingBearer" AS ENUM ('CUSTOMER', 'STORE');

-- AlterTable SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "returnShippingCostDefault" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "returnShippingBearer" TEXT NOT NULL DEFAULT 'CUSTOMER';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "returnDeductShipping" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "returnWindowDays" INTEGER NOT NULL DEFAULT 14;

-- AlterTable ReturnRequest: copy user from order, add columns, keep existing rows
ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "userId" TEXT;
UPDATE "ReturnRequest" AS r
SET "userId" = o."userId"
FROM "Order" AS o
WHERE o."id" = r."orderId" AND r."userId" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "ReturnRequest" WHERE "userId" IS NULL) THEN
    RAISE EXCEPTION 'ReturnRequest rows are missing order userId; refusing to continue';
  END IF;
END $$;

ALTER TABLE "ReturnRequest" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "goodsAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "returnShippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "shippingBearer" "ReturnShippingBearer" NOT NULL DEFAULT 'CUSTOMER';
ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "deductShipping" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "shippingDeducted" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "refundAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "adminReason" TEXT;
ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;
ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "restockedAt" TIMESTAMP(3);
ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;
ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

ALTER TABLE "ReturnRequest" ADD COLUMN IF NOT EXISTS "statusNew" "ReturnStatus" NOT NULL DEFAULT 'PENDING_REVIEW';
UPDATE "ReturnRequest"
SET "statusNew" = CASE lower(status::text)
  WHEN 'approved' THEN 'APPROVED'::"ReturnStatus"
  WHEN 'accepted' THEN 'APPROVED'::"ReturnStatus"
  WHEN 'rejected' THEN 'REJECTED'::"ReturnStatus"
  WHEN 'awaiting_receipt' THEN 'AWAITING_RECEIPT'::"ReturnStatus"
  WHEN 'awaiting' THEN 'AWAITING_RECEIPT'::"ReturnStatus"
  WHEN 'received' THEN 'RECEIVED'::"ReturnStatus"
  WHEN 'refunded' THEN 'REFUNDED'::"ReturnStatus"
  WHEN 'completed' THEN 'COMPLETED'::"ReturnStatus"
  ELSE 'PENDING_REVIEW'::"ReturnStatus"
END;

ALTER TABLE "ReturnRequest" DROP COLUMN "status";
ALTER TABLE "ReturnRequest" RENAME COLUMN "statusNew" TO "status";

DROP INDEX IF EXISTS "ReturnRequest_orderId_key";
CREATE INDEX IF NOT EXISTS "ReturnRequest_orderId_idx" ON "ReturnRequest"("orderId");
CREATE INDEX IF NOT EXISTS "ReturnRequest_userId_idx" ON "ReturnRequest"("userId");
CREATE INDEX IF NOT EXISTS "ReturnRequest_status_idx" ON "ReturnRequest"("status");
CREATE INDEX IF NOT EXISTS "ReturnRequest_createdAt_idx" ON "ReturnRequest"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ReturnRequest_userId_fkey'
  ) THEN
    ALTER TABLE "ReturnRequest"
      ADD CONSTRAINT "ReturnRequest_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable ReturnItem
CREATE TABLE IF NOT EXISTS "ReturnItem" (
    "id" TEXT NOT NULL,
    "returnRequestId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "sku" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" DOUBLE PRECISION NOT NULL,
    "acceptedQuantity" INTEGER,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ReturnItem_returnRequestId_idx" ON "ReturnItem"("returnRequestId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ReturnItem_returnRequestId_fkey'
  ) THEN
    ALTER TABLE "ReturnItem"
      ADD CONSTRAINT "ReturnItem_returnRequestId_fkey"
      FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateTable ReturnRefund
CREATE TABLE IF NOT EXISTS "ReturnRefund" (
    "id" TEXT NOT NULL,
    "returnRequestId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'MANUAL_COD',
    "reference" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "ReturnRefund_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReturnRefund_returnRequestId_key" ON "ReturnRefund"("returnRequestId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ReturnRefund_returnRequestId_fkey'
  ) THEN
    ALTER TABLE "ReturnRefund"
      ADD CONSTRAINT "ReturnRefund_returnRequestId_fkey"
      FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
