import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, STAFF_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { generateTicketNumber } from "@/lib/utils";
import { z } from "zod";
import { TicketPriority, TicketStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const isStaff = requireRole(auth, STAFF_ROLES);
    const status = new URL(request.url).searchParams.get("status") as TicketStatus | null;

    const tickets = await prisma.supportTicket.findMany({
      where: {
        ...(isStaff ? {} : { userId: auth.user.userId }),
        ...(status ? { status } : {}),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        agent: { select: { firstName: true, lastName: true } },
        messages: { take: 1, orderBy: { createdAt: "desc" } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return apiSuccess(tickets);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const { subject, message, priority } = z.object({
      subject: z.string().min(5).max(200),
      message: z.string().min(10),
      priority: z.nativeEnum(TicketPriority).default("MEDIUM"),
    }).parse(await request.json());

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        userId: auth.user.userId,
        subject,
        priority,
        messages: { create: { senderId: auth.user.userId, message } },
      },
      include: { messages: true },
    });

    return apiSuccess(ticket, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, STAFF_ROLES)) return apiError("Unauthorized", 401);

    const { ticketId, status, agentId } = z.object({
      ticketId: z.string(),
      status: z.nativeEnum(TicketStatus).optional(),
      agentId: z.string().optional(),
    }).parse(await request.json());

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(status ? { status } : {}),
        ...(agentId ? { agentId } : {}),
      },
    });

    return apiSuccess(ticket);
  } catch (error) {
    return handleApiError(error);
  }
}
