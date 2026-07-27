import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { branches, siteContent } from "../../../../db/schema";
import { cleanText } from "../../../../lib/restaurant";
import { recordEvent } from "../../../../lib/server-db";
import { staffAccess } from "../../../../lib/staff-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const access = await staffAccess("manage_content");
  if ("response" in access) return access.response;
  try {
    const payload = (await request.json()) as {
      kind?: "branch" | "content";
      id?: string;
      key?: string;
      value?: unknown;
      phone?: string;
      addressAr?: string;
      addressEn?: string;
      active?: boolean;
    };
    const db = getDb();
    if (payload.kind === "branch") {
      const id = cleanText(payload.id, 100);
      const [current] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, id))
        .limit(1);
      if (!current) {
        return Response.json({ error: "الفرع غير موجود." }, { status: 404 });
      }
      const [branch] = await db
        .update(branches)
        .set({
          phone:
            typeof payload.phone === "string"
              ? cleanText(payload.phone, 40)
              : current.phone,
          addressAr:
            typeof payload.addressAr === "string"
              ? cleanText(payload.addressAr, 240)
              : current.addressAr,
          addressEn:
            typeof payload.addressEn === "string"
              ? cleanText(payload.addressEn, 240)
              : current.addressEn,
          active:
            typeof payload.active === "boolean"
              ? payload.active
              : current.active,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(branches.id, id))
        .returning();
      await recordEvent({
        entityType: "branch",
        entityId: id,
        eventType: "branch.updated",
        actor: access.user.email,
      });
      return Response.json({ branch });
    }

    const key = cleanText(payload.key, 100);
    if (!key || payload.value === undefined) {
      return Response.json(
        { error: "مفتاح المحتوى وقيمته مطلوبان." },
        { status: 400 },
      );
    }
    const valueJson = JSON.stringify(payload.value);
    await db
      .insert(siteContent)
      .values({ key, valueJson })
      .onConflictDoUpdate({
        target: siteContent.key,
        set: { valueJson, updatedAt: sql`CURRENT_TIMESTAMP` },
      });
    await recordEvent({
      entityType: "content",
      entityId: key,
      eventType: "content.updated",
      actor: access.user.email,
    });
    return Response.json({ key, value: payload.value });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "تعذر حفظ محتوى الموقع.",
      },
      { status: 503 },
    );
  }
}
