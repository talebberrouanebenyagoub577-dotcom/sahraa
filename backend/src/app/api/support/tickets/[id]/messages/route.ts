import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, STAFF_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const { id } = await params;
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) return apiError("Ticket not found", 404);

    const isStaff = requireRole(auth, STAFF_ROLES);
    if (!isStaff && ticket.userId !== auth.user.userId) {
      return apiError("Forbidden", 403);
    }

    const messages = await prisma.ticketMessage.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess(messages);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const { id } = await params;
    const { message } = z.object({ message: z.string().min(1) }).parse(await request.json());

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) return apiError("Ticket not found", 404);

    const isStaff = requireRole(auth, STAFF_ROLES);
    if (!isStaff && ticket.userId !== auth.user.userId) {
      return apiError("Forbidden", 403);
    }

    const msg = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: auth.user.userId,
        message,
        isStaff,
      },
    });

    await prisma.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date(), ...(isStaff ? { status: "IN_PROGRESS" } : {}) },
    });

    return apiSuccess(msg, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
