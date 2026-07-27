import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { diningSessions } from "../../../db/schema";
import {
  cleanText,
  createId,
  validTableNumber,
} from "../../../lib/restaurant";
import {
  ensureSeed,
  recordEvent,
  sessionSnapshot,
} from "../../../lib/server-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = cleanText(new URL(request.url).searchParams.get("token"), 120);
  if (!token) {
    return Response.json({ error: "رمز جلسة الطاولة مطلوب." }, { status: 400 });
  }
  try {
    await ensureSeed();
    const snapshot = await sessionSnapshot(token);
    if (!snapshot) {
      return Response.json(
        { error: "جلسة الطاولة غير موجودة أو انتهت." },
        { status: 404 },
      );
    }
    return Response.json(snapshot, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر قراءة جلسة الطاولة.",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      branchId?: string;
      tableNumber?: number;
    };
    const tableNumber = validTableNumber(payload.tableNumber);
    const branchId = cleanText(payload.branchId, 80) || "irbid-city-center";
    if (!tableNumber) {
      return Response.json(
        { error: "رقم الطاولة يجب أن يكون بين 1 و80." },
        { status: 400 },
      );
    }
    await ensureSeed();
    const db = getDb();
    const [existing] = await db
      .select()
      .from(diningSessions)
      .where(
        and(
          eq(diningSessions.branchId, branchId),
          eq(diningSessions.tableNumber, tableNumber),
          inArray(diningSessions.status, ["active", "bill_requested"]),
        ),
      )
      .orderBy(desc(diningSessions.createdAt))
      .limit(1);

    if (existing) {
      return Response.json({
        ...(await sessionSnapshot(existing.token)),
        resumed: true,
      });
    }

    const id = createId("ses");
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll(
      "-",
      "",
    );
    await db.insert(diningSessions).values({
      id,
      token,
      branchId,
      tableNumber,
    });
    await recordEvent({
      entityType: "session",
      entityId: id,
      eventType: "session.started",
      payload: { branchId, tableNumber },
    });
    return Response.json(
      { ...(await sessionSnapshot(token)), resumed: false },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر بدء جلسة الطاولة.",
      },
      { status: 503 },
    );
  }
}
