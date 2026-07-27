import { env } from "cloudflare:workers";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  branches,
  diningSessions,
  eventLog,
  menuCategories as menuCategoriesTable,
  menuItems as menuItemsTable,
  orderItems,
  orders,
  serviceRequests,
  siteContent,
} from "../db/schema";
import { menuCategories, menuItems } from "./menu-data";
import { officialBranch } from "./restaurant";

type RuntimeEnv = {
  DB?: D1Database;
  ASSETS?: R2Bucket;
  ADMIN_EMAILS?: string;
  STAFF_ROLE_RULES?: string;
  ORDER_WEBHOOK_URL?: string;
  ALERT_WEBHOOK_URL?: string;
};

export function runtimeEnv() {
  return env as unknown as RuntimeEnv;
}

export function getRawDb() {
  const db = runtimeEnv().DB;
  if (!db) {
    throw new Error("التخزين الدائم غير متاح الآن. حاول مجددًا بعد لحظات.");
  }
  return db;
}

let seedPromise: Promise<void> | null = null;

export function ensureSeed() {
  if (!seedPromise) seedPromise = seedDatabase();
  return seedPromise;
}

async function seedDatabase() {
  const raw = getRawDb();
  const marker = await raw
    .prepare("SELECT value_json FROM site_content WHERE key = ? LIMIT 1")
    .bind("official_seed_v1")
    .first<{ value_json: string }>();
  if (marker) return;

  const categoryStatements = menuCategories.map((entry) =>
    raw
      .prepare(
        `INSERT OR IGNORE INTO menu_categories
        (id, name_ar, name_en, sort_order, active)
        VALUES (?, ?, ?, ?, 1)`,
      )
      .bind(entry.id, entry.nameAr, entry.nameEn, entry.order),
  );

  const itemStatements = menuItems.map((entry) =>
    raw
      .prepare(
        `INSERT OR IGNORE INTO menu_items
        (id, category_id, name_ar, name_en, price_mils, image_url, note_ar,
         note_en, source_ambiguous, available, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        entry.id,
        entry.categoryId,
        entry.nameAr,
        entry.nameEn ?? "",
        entry.priceMils,
        entry.image ?? "",
        entry.noteAr ?? "",
        entry.noteEn ?? "",
        entry.sourceAmbiguous ? 1 : 0,
        entry.available ? 1 : 0,
        entry.featured ? 1 : 0,
      ),
  );

  const branchStatement = raw
    .prepare(
      `INSERT OR IGNORE INTO branches
       (id, name_ar, name_en, address_ar, address_en, phone, map_url,
        hours_json, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    )
    .bind(
      officialBranch.id,
      officialBranch.nameAr,
      officialBranch.nameEn,
      officialBranch.addressAr,
      officialBranch.addressEn,
      officialBranch.phone,
      officialBranch.mapUrl,
      JSON.stringify(officialBranch.hours),
    );

  for (const statements of chunkStatements(
    [...categoryStatements, ...itemStatements],
    70,
  )) {
    await raw.batch(statements);
  }
  await raw.batch([
    branchStatement,
    raw
      .prepare(
        "INSERT OR REPLACE INTO site_content (key, value_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
      )
      .bind(
        "official_seed_v1",
        JSON.stringify({
          source: "Linktree official menu",
          menuUpdatedAt: "2026-06-22",
        }),
      ),
    raw
      .prepare(
        "INSERT OR IGNORE INTO site_content (key, value_json) VALUES (?, ?)",
      )
      .bind(
        "homepage",
        JSON.stringify({
          heroAr: "من المطبخ للطاولة، الطلب ما يضيع.",
          heroEn: "From kitchen to table, every order stays visible.",
          announcementAr: "الأسعار قبل ضريبة المبيعات 7%",
          announcementEn: "Prices exclude 7% sales tax",
        }),
      ),
  ]);
}

function chunkStatements<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

export async function recordEvent(input: {
  entityType: string;
  entityId: string;
  eventType: string;
  payload?: unknown;
  actor?: string;
}) {
  await getDb().insert(eventLog).values({
    id: `evt_${crypto.randomUUID().replaceAll("-", "")}`,
    entityType: input.entityType,
    entityId: input.entityId,
    eventType: input.eventType,
    payloadJson: JSON.stringify(input.payload ?? {}),
    actor: input.actor ?? "system",
  });
}

export async function sessionSnapshot(token: string) {
  const db = getDb();
  const [session] = await db
    .select()
    .from(diningSessions)
    .where(eq(diningSessions.token, token))
    .limit(1);
  if (!session) return null;

  const sessionOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.sessionId, session.id))
    .orderBy(desc(orders.createdAt));
  const ids = sessionOrders.map((entry) => entry.id);
  const items = ids.length
    ? await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, ids))
    : [];
  const requests = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.sessionId, session.id))
    .orderBy(desc(serviceRequests.createdAt));

  return {
    session,
    orders: sessionOrders.map((order) => ({
      ...order,
      items: items.filter((entry) => entry.orderId === order.id),
    })),
    serviceRequests: requests,
  };
}

export async function refreshSessionTotals(sessionId: string) {
  const db = getDb();
  const [totals] = await db
    .select({
      subtotal: sql<number>`coalesce(sum(${orders.subtotalMils}), 0)`,
      tax: sql<number>`coalesce(sum(${orders.taxMils}), 0)`,
      total: sql<number>`coalesce(sum(${orders.totalMils}), 0)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.sessionId, sessionId),
        sql`${orders.status} <> 'cancelled'`,
      ),
    );
  await db
    .update(diningSessions)
    .set({
      subtotalMils: Number(totals?.subtotal ?? 0),
      taxMils: Number(totals?.tax ?? 0),
      totalMils: Number(totals?.total ?? 0),
      version: sql`${diningSessions.version} + 1`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(diningSessions.id, sessionId));
}

export async function publicMenuSnapshot() {
  await ensureSeed();
  const db = getDb();
  const [categories, items, restaurantBranches, content] = await Promise.all([
    db
      .select()
      .from(menuCategoriesTable)
      .where(eq(menuCategoriesTable.active, true))
      .orderBy(menuCategoriesTable.sortOrder),
    db.select().from(menuItemsTable).orderBy(menuItemsTable.categoryId),
    db.select().from(branches).where(eq(branches.active, true)),
    db.select().from(siteContent),
  ]);
  return {
    categories,
    items,
    branches: restaurantBranches.map((branch) => ({
      ...branch,
      hours: JSON.parse(branch.hoursJson),
    })),
    content: Object.fromEntries(
      content.map((entry) => [entry.key, JSON.parse(entry.valueJson)]),
    ),
  };
}

export async function fireOptionalWebhook(
  url: string | undefined,
  payload: unknown,
) {
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3500),
    });
  } catch {
    // External alerts are best-effort; D1 remains the source of truth.
  }
}
