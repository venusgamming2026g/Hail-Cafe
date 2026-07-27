import { menuCategories, menuItems } from "../../../lib/menu-data";
import { officialBranch } from "../../../lib/restaurant";
import { publicMenuSnapshot } from "../../../lib/server-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await publicMenuSnapshot();
    return Response.json(
      { ...snapshot, taxRate: 0.07, source: "official-persistent" },
      { headers: { "cache-control": "public, max-age=15, stale-while-revalidate=60" } },
    );
  } catch {
    return Response.json(
      {
        categories: menuCategories.map((entry) => ({
          id: entry.id,
          nameAr: entry.nameAr,
          nameEn: entry.nameEn,
          sortOrder: entry.order,
          active: true,
        })),
        items: menuItems.map((entry) => ({
          ...entry,
          imageUrl: entry.image ?? "",
        })),
        branches: [
          {
            ...officialBranch,
            hoursJson: JSON.stringify(officialBranch.hours),
          },
        ],
        content: {},
        taxRate: 0.07,
        source: "official-read-only-fallback",
      },
      {
        headers: {
          "cache-control": "public, max-age=10",
          "x-hail-storage": "fallback",
        },
      },
    );
  }
}
