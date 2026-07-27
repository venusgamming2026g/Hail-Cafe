import { getDb } from "../../../../db";
import { uploadedAssets } from "../../../../db/schema";
import { createId } from "../../../../lib/restaurant";
import { runtimeEnv } from "../../../../lib/server-db";
import { staffAccess } from "../../../../lib/staff-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = await staffAccess("upload_asset");
  if ("response" in access) return access.response;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "ملف الصورة مطلوب." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return Response.json(
        { error: "يمكن رفع ملفات الصور فقط." },
        { status: 400 },
      );
    }
    if (file.size > 6 * 1024 * 1024) {
      return Response.json(
        { error: "حجم الصورة يجب ألا يتجاوز 6 ميجابايت." },
        { status: 413 },
      );
    }
    const bucket = runtimeEnv().ASSETS;
    if (!bucket) {
      return Response.json(
        { error: "تخزين الصور غير متاح في هذه البيئة." },
        { status: 503 },
      );
    }
    const assetId = createId("asset");
    const extension = file.type.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "bin";
    const objectKey = `menu/${assetId}.${extension}`;
    await bucket.put(objectKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
    });
    await getDb().insert(uploadedAssets).values({
      id: assetId,
      objectKey,
      contentType: file.type,
      sizeBytes: file.size,
      uploadedBy: access.user.email,
    });
    return Response.json(
      { id: assetId, url: `/api/assets/${objectKey}` },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "تعذر رفع الصورة.",
      },
      { status: 503 },
    );
  }
}
