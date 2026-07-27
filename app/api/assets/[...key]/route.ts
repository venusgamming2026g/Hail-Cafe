import { runtimeEnv } from "../../../../lib/server-db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const { key } = await context.params;
  const objectKey = key.map(decodeURIComponent).join("/");
  if (!objectKey.startsWith("menu/") || objectKey.includes("..")) {
    return new Response("Not found", { status: 404 });
  }
  const bucket = runtimeEnv().ASSETS;
  if (!bucket) return new Response("Not found", { status: 404 });
  const object = await bucket.get(objectKey);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
