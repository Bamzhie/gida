import type { AdminListingDto } from "@/lib/api-types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function adminListingHref(listing: Pick<AdminListingDto, "id" | "title">): string {
  const title = listing.title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24)
    .replace(/-$/g, "") || "listing";
  const compactId = Buffer.from(listing.id.replaceAll("-", ""), "hex").toString("base64url");
  return `/admin/listings/${title}-${compactId}`;
}

export function adminListingIdFromSlug(slug: string): string | null {
  if (slug.length < 24 || slug[slug.length - 23] !== "-") return null;
  const compactId = slug.slice(-22);
  if (!/^[A-Za-z0-9_-]{22}$/.test(compactId)) return null;
  const hex = Buffer.from(compactId, "base64url").toString("hex");
  if (hex.length !== 32) return null;
  const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  return UUID.test(id) ? id : null;
}

export function isListingUuid(value: string): boolean {
  return UUID.test(value);
}
