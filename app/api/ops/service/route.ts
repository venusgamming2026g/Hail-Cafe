import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { diningSessions, serviceRequests } from "../../../../db/schema";
import {
  cleanText,
  serviceStatuses,
} from "../../../../lib/restaurant";
import { recordEvent } from "../../../../lib/server-db";
import { staffAccess } from "../../../../lib/staff-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const access = await staffAccess("update_service");
  if ("response" in access) return access.response;
  try {
    const payload = (await request.json()) as {
      requestId?: string;
      status?: string;
    };
    const requestId = cleanText(payload.requestId, 100);
    const status = cleanText(payload.status, 30);
    if (!serviceStatuses.includes(status as never)) {
      return Response.json(
        { error: "حالة خدمة الطاولة غير صالحة." },
        { status: 400 },
      );
    }
    const db = getDb();
    const [current] = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, requestId))
      .limit(1);
    if (!current) {
      return Response.json(
        { error: "طلب الخدمة غير موجود." },
        { status: 404 },
      );
    }
    const timestamps: Record<string, unknown> = {
      updatedAt: sql`CURRENT_TIMESTAMP`,
      status,
    };
    if (status === "acknowledged")
      timestamps.acknowledgedAt = new Date().toISOString();
    if (status === "on_way") timestamps.onWayAt = new Date().toISOString();
    if (status === "completed")
      timestamps.completedAt = new Date().toISOString();
    await db
      .update(serviceRequests)
      .set(timestamps)
      .where(eq(serviceRequests.id, requestId));

    if (current.requestType === "bill" && status === "completed") {
      await db
        .update(diningSessions)
        .set({
          status: "closed",
          closedAt: new Date().toISOString(),
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(diningSessions.id, current.sessionId));
    }
    await recordEvent({
      entityType: "service",
      entityId: requestId,
      eventType: `service.${status}`,
      payload: { previousStatus: current.status, type: current.requestType },
      actor: access.user.email,
    });
    const [updated] = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, requestId))
      .limit(1);
    return Response.json({ request: updated });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر تحديث خدمة الطاولة.",
      },
      { status: 503 },
    );
  }
}
