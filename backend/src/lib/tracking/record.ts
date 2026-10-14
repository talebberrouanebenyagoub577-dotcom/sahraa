import prisma from "@/lib/prisma";

export async function claimTrackingEvent(
  eventId: string,
  platform: string,
  eventName: string
): Promise<boolean> {
  try {
    await prisma.trackingEvent.create({
      data: { eventId, platform, eventName, status: "pending" },
    });
    return true;
  } catch {
    return false;
  }
}

export async function finishTrackingEvent(
  eventId: string,
  platform: string,
  status: "sent" | "failed" | "skipped"
): Promise<void> {
  try {
    await prisma.trackingEvent.update({
      where: { eventId_platform: { eventId, platform } },
      data: { status, sentAt: new Date() },
    });
  } catch (error) {
    console.error("[tracking] status update failed", error instanceof Error ? error.message : "");
  }
}
