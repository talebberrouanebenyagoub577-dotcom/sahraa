-- AlterTable
ALTER TABLE "Order" ADD COLUMN "confirmationNotes" TEXT,
ADD COLUMN "courierName" TEXT,
ADD COLUMN "utmSource" TEXT,
ADD COLUMN "utmCampaign" TEXT,
ADD COLUMN "utmContent" TEXT,
ADD COLUMN "utmTerm" TEXT;

-- CreateTable
CREATE TABLE "TrackingEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackingEvent_eventId_platform_key" ON "TrackingEvent"("eventId", "platform");

-- CreateIndex
CREATE INDEX "TrackingEvent_sentAt_idx" ON "TrackingEvent"("sentAt");
