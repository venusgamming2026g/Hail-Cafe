import { and, desc, eq, ne } from "drizzle-orm";
import { getDb } from "../../../db";
import { diningSessions, serviceRequests } from "../../../db/schema";
import {
  cleanText,
  createId,
  serviceRequestTypes,
} from "../../../lib/restaurant";
import {
  ensureSeed,
  fireOptionalWebhook,
  recordEvent,
  runtimeEnv,
  sessionSnapshot,
} from "../../../lib/server-db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      idempotencyKey?: string;
      sessionToken?: string;
      requestType?: string;
    };
    const idempotencyKey = cleanText(payload.idempotencyKey, 120);
    const sessionToken = cleanText(payload.sessionToken, 160);
    const requestType = cleanText(payload.requestType, 40);
    if (
      idempotencyKey.length < 8 ||
      !sessionToken ||
      !serviceRequestTypes.includes(
        requestType as (typeof serviceRequestTypes)[number],
      )
    ) {
      return Response.json(
        { error: "طلب الخدمة غير مكتمل." },
        { status: 400 },
      );
    }
    await ensureSeed();
    const db = getDb();
    const [duplicate] = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.idempotencyKey, idempotencyKey))
      .limit(1);
    if (duplicate) {
      return Response.json({
        request: duplicate,
        duplicate: true,
        session: await sessionSnapshot(sessionToken),
      });
    }
    const [session] = await db
      .select()
      .from(diningSessions)
      .where(
        and(
          eq(diningSessions.token, sessionToken),
          eq(diningSessions.status, "active"),
        ),
      )
      .limit(1);
    if (!session) {
      return Response.json(
        { error: "جلسة الطاولة غير صالحة أو أُغلق الحساب." },
        { status: 409 },
      );
    }
    const [activeSameType] = await db
      .select()
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.sessionId, session.id),
          eq(serviceRequests.requestType, requestType),
          ne(serviceRequests.status, "completed"),
          ne(serviceRequests.status, "cancelled"),
        ),
      )
      .orderBy(desc(serviceRequests.createdAt))
      .limit(1);
    if (activeSameType) {
      return Response.json(
        {
          request: activeSameType,
          duplicate: true,
          message: "طلب الخدمة نفسه ما يزال قيد التنفيذ.",
          session: await sessionSnapshot(sessionToken),
        },
        { status: 200 },
      );
    }

    const id = createId("svc");
    const [created] = await db
      .insert(serviceRequests)
      .values({
        id,
        idempotencyKey,
        sessionId: session.id,
        tableNumber: session.tableNumber,
        requestType,
      })
      .returning();
    if (requestType === "bill") {
      await db
        .update(diningSessions)
        .set({ status: "bill_requested" })
        .where(eq(diningSessions.id, session.id));
    }
    await recordEvent({
      entityType: "service",
      entityId: id,
      eventType: "service.created",
      payload: { requestType, tableNumber: session.tableNumber },
      actor: "customer",
    });
    await fireOptionalWebhook(runtimeEnv().ALERT_WEBHOOK_URL, {
      event: "service.created",
      request: created,
    });
    return Response.json(
      {
        request: created,
        duplicate: false,
        session: await sessionSnapshot(sessionToken),
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر إرسال طلب الخدمة.",
      },
      { status: 503 },
    );
  }
}
