import prisma from "@/lib/prisma";

function prismaCode(error: unknown): string {
  if (typeof error === "object" && error && "code" in error) {
    return String((error as { code?: string }).code || "");
  }
  return "";
}

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
  } catch (error) {
    if (prismaCode(error) === "P2002") return false;
    console.warn("[capi] claim storage failed; sending anyway");
    return true;
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
