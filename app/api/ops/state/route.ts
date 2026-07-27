import { desc, inArray } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  branches,
  diningSessions,
  eventLog,
  menuCategories,
  menuItems,
  orderItems,
  orders,
  serviceRequests,
  siteContent,
} from "../../../../db/schema";
import { ensureSeed } from "../../../../lib/server-db";
import { staffAccess } from "../../../../lib/staff-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await staffAccess("read_ops");
  if ("response" in access) return access.response;
  try {
    await ensureSeed();
    const db = getDb();
    const [
      currentOrders,
      currentItems,
      sessions,
      requests,
      categories,
      items,
      restaurantBranches,
      contentRows,
      events,
    ] = await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(120),
      db.select().from(orderItems).orderBy(desc(orderItems.createdAt)).limit(800),
      db
        .select()
        .from(diningSessions)
        .where(
          inArray(diningSessions.status, ["active", "bill_requested"]),
        )
        .orderBy(desc(diningSessions.updatedAt))
        .limit(80),
      db
        .select()
        .from(serviceRequests)
        .orderBy(desc(serviceRequests.createdAt))
        .limit(120),
      db.select().from(menuCategories).orderBy(menuCategories.sortOrder),
      db.select().from(menuItems).orderBy(menuItems.categoryId),
      db.select().from(branches),
      db.select().from(siteContent),
      db.select().from(eventLog).orderBy(desc(eventLog.createdAt)).limit(80),
    ]);

    return Response.json(
      {
        user: { email: access.user.email, displayName: access.user.displayName },
        role: access.role,
        orders: currentOrders.map((order) => ({
          ...order,
          items: currentItems.filter((entry) => entry.orderId === order.id),
        })),
        sessions,
        serviceRequests: requests,
        menu: { categories, items },
        branches: restaurantBranches.map((branch) => ({
          ...branch,
          hours: JSON.parse(branch.hoursJson),
        })),
        content: Object.fromEntries(
          contentRows.map((entry) => [
            entry.key,
            JSON.parse(entry.valueJson),
          ]),
        ),
        events,
        serverTime: new Date().toISOString(),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر تحميل لوحة التشغيل.",
      },
      { status: 503 },
    );
  }
}
