import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { menuItems } from "../../../../db/schema";
import { cleanText } from "../../../../lib/restaurant";
import { recordEvent } from "../../../../lib/server-db";
import { staffAccess } from "../../../../lib/staff-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const access = await staffAccess("manage_menu");
  if ("response" in access) return access.response;
  try {
    const payload = (await request.json()) as {
      itemId?: string;
      priceMils?: number;
      available?: boolean;
      nameAr?: string;
      nameEn?: string;
      imageUrl?: string;
    };
    const itemId = cleanText(payload.itemId, 100);
    const db = getDb();
    const [current] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, itemId))
      .limit(1);
    if (!current) {
      return Response.json({ error: "الصنف غير موجود." }, { status: 404 });
    }
    const updates: Partial<typeof menuItems.$inferInsert> = {
      updatedAt: sql`CURRENT_TIMESTAMP` as unknown as string,
    };
    if (
      Number.isInteger(payload.priceMils) &&
      Number(payload.priceMils) >= 100 &&
      Number(payload.priceMils) <= 100000
    ) {
      updates.priceMils = Number(payload.priceMils);
    }
    if (typeof payload.available === "boolean")
      updates.available = payload.available;
    if (typeof payload.nameAr === "string")
      updates.nameAr = cleanText(payload.nameAr, 120);
    if (typeof payload.nameEn === "string")
      updates.nameEn = cleanText(payload.nameEn, 120);
    if (typeof payload.imageUrl === "string")
      updates.imageUrl = cleanText(payload.imageUrl, 400);

    const [updated] = await db
      .update(menuItems)
      .set(updates)
      .where(eq(menuItems.id, itemId))
      .returning();
    await recordEvent({
      entityType: "menu_item",
      entityId: itemId,
      eventType: "menu_item.updated",
      payload: {
        before: {
          priceMils: current.priceMils,
          available: current.available,
          imageUrl: current.imageUrl,
        },
        after: {
          priceMils: updated.priceMils,
          available: updated.available,
          imageUrl: updated.imageUrl,
        },
      },
      actor: access.user.email,
    });
    return Response.json({ item: updated });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "تعذر حفظ تعديل المنيو.",
      },
      { status: 503 },
    );
  }
}
