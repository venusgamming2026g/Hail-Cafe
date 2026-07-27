import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  diningSessions,
  menuItems as menuItemsTable,
  orders,
} from "../../../db/schema";
import {
  cleanText,
  createId,
  createPublicOrderId,
  taxFor,
  validTableNumber,
} from "../../../lib/restaurant";
import {
  ensureSeed,
  fireOptionalWebhook,
  getRawDb,
  refreshSessionTotals,
  runtimeEnv,
  sessionSnapshot,
} from "../../../lib/server-db";

export const dynamic = "force-dynamic";

type SubmittedItem = {
  id?: string;
  quantity?: number;
  note?: string;
};

export async function POST(request: Request) {
  let payload: {
    idempotencyKey?: string;
    branchId?: string;
    orderType?: "dine_in" | "takeaway";
    tableNumber?: number;
    sessionToken?: string;
    customerName?: string;
    phone?: string;
    note?: string;
    items?: SubmittedItem[];
  };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return Response.json({ error: "صيغة الطلب غير صالحة." }, { status: 400 });
  }

  const idempotencyKey = cleanText(payload.idempotencyKey, 120);
  const branchId = cleanText(payload.branchId, 80) || "irbid-city-center";
  const orderType = payload.orderType === "dine_in" ? "dine_in" : "takeaway";
  const tableNumber =
    orderType === "dine_in" ? validTableNumber(payload.tableNumber) : null;
  const sessionToken = cleanText(payload.sessionToken, 160);
  const submitted = Array.isArray(payload.items)
    ? payload.items.slice(0, 50)
    : [];

  if (idempotencyKey.length < 8) {
    return Response.json(
      { error: "تعذر تأمين الطلب ضد التكرار. حدّث الصفحة وحاول مجددًا." },
      { status: 400 },
    );
  }
  if (!submitted.length) {
    return Response.json({ error: "السلة فارغة." }, { status: 400 });
  }
  if (orderType === "dine_in" && (!tableNumber || !sessionToken)) {
    return Response.json(
      { error: "ابدأ جلسة الطاولة قبل إرسال الطلب." },
      { status: 400 },
    );
  }

  try {
    await ensureSeed();
    const db = getDb();
    const [duplicate] = await db
      .select()
      .from(orders)
      .where(eq(orders.idempotencyKey, idempotencyKey))
      .limit(1);
    if (duplicate) {
      return Response.json({
        order: duplicate,
        duplicate: true,
        session: sessionToken
          ? await sessionSnapshot(sessionToken)
          : undefined,
      });
    }

    let session: typeof diningSessions.$inferSelect | null = null;
    if (orderType === "dine_in") {
      [session] = await db
        .select()
        .from(diningSessions)
        .where(
          and(
            eq(diningSessions.token, sessionToken),
            eq(diningSessions.status, "active"),
            eq(diningSessions.tableNumber, tableNumber!),
          ),
        )
        .limit(1);
      if (!session) {
        return Response.json(
          { error: "جلسة الطاولة غير صالحة أو أُغلق الحساب." },
          { status: 409 },
        );
      }
    }

    const normalized = submitted
      .map((entry) => ({
        id: cleanText(entry.id, 100),
        quantity: Math.max(1, Math.min(20, Number(entry.quantity) || 1)),
        note: cleanText(entry.note, 160),
      }))
      .filter((entry) => entry.id);
    const ids = [...new Set(normalized.map((entry) => entry.id))];
    const currentItems = await db
      .select()
      .from(menuItemsTable)
      .where(inArray(menuItemsTable.id, ids));
    const byId = new Map(currentItems.map((entry) => [entry.id, entry]));
    const unavailable = normalized.find(
      (entry) => !byId.get(entry.id)?.available,
    );
    if (unavailable) {
      return Response.json(
        {
          error: `الصنف «${byId.get(unavailable.id)?.nameAr ?? unavailable.id}» غير متاح الآن.`,
        },
        { status: 409 },
      );
    }

    const subtotalMils = normalized.reduce(
      (sum, entry) =>
        sum + (byId.get(entry.id)?.priceMils ?? 0) * entry.quantity,
      0,
    );
    if (!subtotalMils) {
      return Response.json(
        { error: "تعذر احتساب أسعار الأصناف." },
        { status: 409 },
      );
    }
    const taxMils = taxFor(subtotalMils);
    const totalMils = subtotalMils + taxMils;
    let roundNumber = 1;
    if (session) {
      const [round] = await db
        .select({ value: sql<number>`coalesce(max(${orders.roundNumber}), 0)` })
        .from(orders)
        .where(eq(orders.sessionId, session.id));
      roundNumber = Number(round?.value ?? 0) + 1;
    }

    const orderId = createId("ord");
    const publicId = createPublicOrderId();
    const raw = getRawDb();
    const statements = [
      raw
        .prepare(
          `INSERT INTO orders
          (id, public_id, idempotency_key, session_id, branch_id, order_type,
           table_number, customer_name, phone, status, round_number,
           subtotal_mils, tax_mils, total_mils, note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?)`,
        )
        .bind(
          orderId,
          publicId,
          idempotencyKey,
          session?.id ?? null,
          branchId,
          orderType,
          tableNumber,
          cleanText(payload.customerName, 80),
          cleanText(payload.phone, 40),
          roundNumber,
          subtotalMils,
          taxMils,
          totalMils,
          cleanText(payload.note, 240),
        ),
      ...normalized.map((entry) => {
        const current = byId.get(entry.id)!;
        return raw
          .prepare(
            `INSERT INTO order_items
            (id, order_id, menu_item_id, name_ar, name_en, quantity,
             unit_price_mils, status, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
          )
          .bind(
            createId("itm"),
            orderId,
            current.id,
            current.nameAr,
            current.nameEn,
            entry.quantity,
            current.priceMils,
            entry.note,
          );
      }),
      raw
        .prepare(
          `INSERT INTO event_log
          (id, entity_type, entity_id, event_type, payload_json, actor)
          VALUES (?, 'order', ?, 'order.created', ?, 'customer')`,
        )
        .bind(
          createId("evt"),
          orderId,
          JSON.stringify({ publicId, orderType, tableNumber, roundNumber }),
        ),
    ];
    await raw.batch(statements);
    if (session) await refreshSessionTotals(session.id);

    const [created] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .orderBy(desc(orders.createdAt))
      .limit(1);
    await fireOptionalWebhook(runtimeEnv().ORDER_WEBHOOK_URL, {
      event: "order.created",
      order: created,
    });
    return Response.json(
      {
        order: created,
        duplicate: false,
        session: sessionToken
          ? await sessionSnapshot(sessionToken)
          : undefined,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "تعذر إرسال الطلب.";
    if (/UNIQUE|idempotency/i.test(message)) {
      try {
        const [duplicate] = await getDb()
          .select()
          .from(orders)
          .where(eq(orders.idempotencyKey, idempotencyKey))
          .limit(1);
        if (duplicate) {
          return Response.json({ order: duplicate, duplicate: true });
        }
      } catch {
        // Continue to the clear service-unavailable response below.
      }
    }
    return Response.json(
      { error: message || "تعذر إرسال الطلب. حاول مجددًا." },
      { status: 503 },
    );
  }
}
