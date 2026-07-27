import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { orderItems, orders } from "../../../../db/schema";
import {
  cleanText,
  orderStatuses,
} from "../../../../lib/restaurant";
import {
  recordEvent,
  refreshSessionTotals,
} from "../../../../lib/server-db";
import { staffAccess } from "../../../../lib/staff-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const access = await staffAccess("update_order");
  if ("response" in access) return access.response;
  try {
    const payload = (await request.json()) as {
      orderId?: string;
      status?: string;
      itemId?: string;
      itemStatus?: string;
    };
    const orderId = cleanText(payload.orderId, 100);
    const status = cleanText(payload.status, 30);
    const itemId = cleanText(payload.itemId, 100);
    const itemStatus = cleanText(payload.itemStatus, 30);
    const db = getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (!order) {
      return Response.json({ error: "الطلب غير موجود." }, { status: 404 });
    }

    if (itemId && orderStatuses.includes(itemStatus as never)) {
      await db
        .update(orderItems)
        .set({ status: itemStatus, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(orderItems.id, itemId));
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
      const active = items.filter((entry) => entry.status !== "cancelled");
      const derived =
        active.length && active.every((entry) => entry.status === "served")
          ? "served"
          : active.length &&
              active.every((entry) =>
                ["ready", "served"].includes(entry.status),
              )
            ? "ready"
            : active.some((entry) => entry.status === "preparing")
              ? "preparing"
              : "new";
      await db
        .update(orders)
        .set({ status: derived, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(orders.id, orderId));
      await recordEvent({
        entityType: "order_item",
        entityId: itemId,
        eventType: `item.${itemStatus}`,
        payload: { orderId, derivedOrderStatus: derived },
        actor: access.user.email,
      });
    } else if (orderStatuses.includes(status as never)) {
      await db
        .update(orders)
        .set({ status, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(orders.id, orderId));
      await db
        .update(orderItems)
        .set({ status, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(orderItems.orderId, orderId));
      await recordEvent({
        entityType: "order",
        entityId: orderId,
        eventType: `order.${status}`,
        payload: { previousStatus: order.status },
        actor: access.user.email,
      });
    } else {
      return Response.json(
        { error: "حالة الطلب غير صالحة." },
        { status: 400 },
      );
    }

    if (order.sessionId) await refreshSessionTotals(order.sessionId);
    const [updated] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    return Response.json({ order: updated });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "تعذر تحديث حالة الطلب.",
      },
      { status: 503 },
    );
  }
}
