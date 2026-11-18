import { eq } from "drizzle-orm";
import { db } from "@/db";
import { itemImage, itemReport } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { getObject } from "@/lib/storage";

/**
 * Serves item photos. Photos of hidden listings, and uploads not yet attached
 * to a report, are only served to their owner or a moderator.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/images/[id]">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });

  const [row] = await db
    .select({
      storageKey: itemImage.storageKey,
      thumbKey: itemImage.thumbKey,
      uploaderId: itemImage.uploaderId,
      itemReportId: itemImage.itemReportId,
      visibility: itemReport.visibility,
    })
    .from(itemImage)
    .leftJoin(itemReport, eq(itemImage.itemReportId, itemReport.id))
    .where(eq(itemImage.id, id))
    .limit(1);
  if (!row) return new Response("Not found", { status: 404 });

  const isPublic = row.itemReportId !== null && row.visibility === "VISIBLE";
  if (!isPublic) {
    const viewer = await getCurrentUser();
    if (!viewer || (viewer.id !== row.uploaderId && viewer.role !== "admin")) {
      return new Response("Not found", { status: 404 });
    }
  }

  const size = new URL(request.url).searchParams.get("size");
  const data = await getObject(size === "thumb" ? row.thumbKey : row.storageKey);
  if (!data) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": isPublic ? "public, max-age=3600" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
