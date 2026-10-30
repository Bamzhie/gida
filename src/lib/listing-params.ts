import type {
  Availability,
  ListingCategory,
  ListingSearch,
  ListingType,
  PropertyType,
} from "@/lib/api-types";

export const PAGE_SIZE = 12;

export type ListingSort = NonNullable<ListingSearch["sort"]>;

export type ListingQuery = {
  q?: string;
  location?: string;
  advertiser?: string;
  listingType?: ListingType;
  category?: ListingCategory;
  propertyType?: PropertyType;
  availability?: Availability;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: ListingSort;
  page?: number;
};

const LISTING_TYPES = new Set(["SALE", "RENT"]);
const CATEGORIES = new Set(["STANDARD", "NEW_HOMES", "SHORTLET"]);
const PROPERTY_TYPES = new Set(["APARTMENT", "HOUSE", "TOWNHOUSE", "CONDO", "LAND", "COMMERCIAL"]);
const AVAILABILITY = new Set(["AVAILABLE", "PENDING", "SOLD", "RENTED"]);
const SORTS = new Set(["newest", "oldest", "price-asc", "price-desc", "updated", "confirmed", "relevance"]);

function text(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function pick(value: string | null, allowed: Set<string>): string | undefined {
  return value && allowed.has(value) ? value : undefined;
}

function positiveInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function parseListingQuery(params: URLSearchParams): ListingQuery {
  const q = text(params.get("q"));
  const page = positiveInt(params.get("page"));
  const sort = pick(params.get("sort"), SORTS) as ListingSort | undefined;
  return {
    q,
    location: text(params.get("location")),
    advertiser: text(params.get("advertiser")),
    listingType: pick(params.get("listingType"), LISTING_TYPES) as ListingType | undefined,
    category: pick(params.get("category"), CATEGORIES) as ListingCategory | undefined,
    propertyType: pick(params.get("propertyType"), PROPERTY_TYPES) as PropertyType | undefined,
    availability: pick(params.get("availability"), AVAILABILITY) as Availability | undefined,
    bedrooms: positiveInt(params.get("bedrooms")),
    minPrice: positiveInt(params.get("minPrice")),
    maxPrice: positiveInt(params.get("maxPrice")),
    // The API rejects sort=relevance with 400 relevance_requires_keyword when q is absent.
    sort: sort === "relevance" && !q ? undefined : sort,
    page: page && page > 1 ? page : undefined,
  };
}

export function listingQueryToSearchParams(query: ListingQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.location) params.set("location", query.location);
  if (query.advertiser) params.set("advertiser", query.advertiser);
  if (query.listingType) params.set("listingType", query.listingType);
  if (query.category) params.set("category", query.category);
  if (query.propertyType) params.set("propertyType", query.propertyType);
  if (query.availability) params.set("availability", query.availability);
  if (query.bedrooms) params.set("bedrooms", String(query.bedrooms));
  if (query.minPrice) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice) params.set("maxPrice", String(query.maxPrice));
  if (query.sort && query.sort !== "newest") params.set("sort", query.sort);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  return params;
}

export function toListingSearch(query: ListingQuery): ListingSearch {
  return {
    q: query.q,
    location: query.location,
    advertiser: query.advertiser,
    listingType: query.listingType,
    category: query.category,
    propertyType: query.propertyType,
    availability: query.availability,
    bedrooms: query.bedrooms,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sort: query.sort ?? "newest",
    page: query.page ?? 1,
    size: PAGE_SIZE,
  };
}
