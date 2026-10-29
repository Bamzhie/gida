import type { MetadataRoute } from "next";
import { searchListings } from "@/lib/listings";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

const staticRoutes = [
  "/",
  "/listings",
  "/map",
  "/agents",
  "/how-it-works",
  "/cost-guide",
  "/trust",
  "/contact",
  "/list-your-property",
  "/requests",
  "/privacy",
  "/terms",
];

const MAX_PAGES = 10;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
  }));

  const listingEntries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await searchListings({ sort: "updated", page, size: 100 }, 3600).catch(() => null);
    if (!result || result.items.length === 0) break;

    for (const listing of result.items) {
      if (seen.has(listing.id)) continue;
      seen.add(listing.id);
      listingEntries.push({
        url: new URL(`/listings/${listing.id}`, siteUrl).toString(),
        lastModified: listing.confirmedAt ? new Date(listing.confirmedAt) : undefined,
      });
    }

    if (page >= result.pages) break;
  }

  return [...staticEntries, ...listingEntries];
}
