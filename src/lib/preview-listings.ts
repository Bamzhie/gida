import { PREVIEW_PROPERTIES, type ListingCategory, type PreviewProperty } from "@/lib/preview-data";

export type ListingQuery = {
  city?: string;
  keyword?: string;
  listingType?: "SALE" | "RENT";
  category?: ListingCategory;
  propertyType?: string;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc";
};

function textMatches(property: PreviewProperty, keyword: string): boolean {
  const haystack = [
    property.title,
    property.description,
    property.address,
    property.city,
    property.state,
    property.propertyType,
    property.agentName,
    ...property.amenities,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(keyword.trim().toLowerCase());
}

export function filterPreviewProperties(
  properties: PreviewProperty[],
  query: ListingQuery
): PreviewProperty[] {
  const result = properties.filter((property) => {
    if (query.city && !`${property.city} ${property.address}`.toLowerCase().includes(query.city.toLowerCase())) {
      return false;
    }
    if (query.keyword && !textMatches(property, query.keyword)) return false;
    if (query.listingType && property.listingType !== query.listingType) return false;
    if (query.category && property.category !== query.category) return false;
    if (query.propertyType && property.propertyType !== query.propertyType) return false;
    if (query.bedrooms !== undefined && (property.bedrooms ?? 0) < query.bedrooms) return false;
    if (query.minPrice !== undefined && property.price < query.minPrice) return false;
    if (query.maxPrice !== undefined && property.price > query.maxPrice) return false;
    return true;
  });

  return result.sort((a, b) => {
    if (query.sort === "price-asc") return a.price - b.price;
    if (query.sort === "price-desc") return b.price - a.price;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function getPreviewProperties(query: ListingQuery = {}): PreviewProperty[] {
  return filterPreviewProperties(PREVIEW_PROPERTIES, query);
}

export function getPreviewProperty(id: string): PreviewProperty | undefined {
  return PREVIEW_PROPERTIES.find((property) => property.id === id);
}

export function parseListingQuery(searchParams: URLSearchParams): ListingQuery {
  const number = (key: string): number | undefined => {
    const value = searchParams.get(key);
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  const listingType = searchParams.get("listingType");
  const category = searchParams.get("category");
  const sort = searchParams.get("sort");
  return {
    city: searchParams.get("city") || undefined,
    keyword: searchParams.get("keyword") || undefined,
    listingType: listingType === "SALE" || listingType === "RENT" ? listingType : undefined,
    category: category === "SHORTLET" || category === "NEWHOMES" ? category : undefined,
    propertyType: searchParams.get("propertyType") || undefined,
    bedrooms: number("bedrooms"),
    minPrice: number("minPrice"),
    maxPrice: number("maxPrice"),
    sort: sort === "price-asc" || sort === "price-desc" || sort === "newest" ? sort : "newest",
  };
}

export function listingQueryToSearchParams(query: ListingQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.city) params.set("city", query.city);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.listingType) params.set("listingType", query.listingType);
  if (query.category) params.set("category", query.category);
  if (query.propertyType) params.set("propertyType", query.propertyType);
  if (query.bedrooms !== undefined) params.set("bedrooms", String(query.bedrooms));
  if (query.minPrice !== undefined) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("maxPrice", String(query.maxPrice));
  if (query.sort && query.sort !== "newest") params.set("sort", query.sort);
  return params;
}

export function formatPriceWithFrequency(price: number, listingType: PreviewProperty["listingType"]): string {
  const suffix = listingType === "RENT" ? "/year" : "";
  return `${new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(price)}${suffix}`;
}
