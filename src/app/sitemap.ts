import type { MetadataRoute } from "next";
import { PREVIEW_PROPERTIES } from "@/lib/preview-data";
import { siteUrl } from "@/lib/site";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = staticRoutes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
  }));

  const listingEntries = PREVIEW_PROPERTIES.map((property) => ({
    url: new URL(`/listings/${property.id}`, siteUrl).toString(),
    lastModified: new Date(property.updatedAt),
  }));

  return [...staticEntries, ...listingEntries];
}
