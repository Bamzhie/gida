export type ListingType = "SALE" | "RENT";
export type ListingCategory = "STANDARD" | "NEW_HOMES" | "SHORTLET";
export type PricePeriod = "YEAR" | "MONTH" | "NIGHT" | "STAY";
export type Availability = "AVAILABLE" | "PENDING" | "SOLD" | "RENTED";
export type PropertyType = "APARTMENT" | "HOUSE" | "TOWNHOUSE" | "CONDO" | "LAND" | "COMMERCIAL";
export type Role = "USER" | "AGENT" | "ADMIN";
export type CostType = "AGENCY_FEE" | "LEGAL_FEE" | "SERVICE_CHARGE" | "CAUTION" | "OTHER";
export type MediaKind = "PHOTO" | "VIDEO" | "FLOOR_PLAN";
export type LocationKind = "STATE" | "LGA" | "AREA" | "ESTATE" | "LANDMARK";

export type ImageDto = {
  url: string;
  caption: string | null;
};

export type ListingSummaryDto = {
  id: string;
  title: string;
  listingType: ListingType;
  category: ListingCategory;
  propertyType: PropertyType;
  price: number;
  pricePeriod: PricePeriod | null;
  availability: Availability;
  area: string | null;
  state: string | null;
  addressLine: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  latitude: number | null;
  longitude: number | null;
  primaryImage: ImageDto | null;
  hasDisclosedFees: boolean;
  confirmedAt: string | null;
};

export type CostDto = {
  type: CostType;
  amount: number;
  note: string | null;
};

export type MediaDto = {
  url: string;
  caption: string | null;
  kind: MediaKind;
  sortOrder: number;
};

export type AdvertiserDto = {
  id: string;
  name: string;
  agencyName: string | null;
  phone: string | null;
};

export type AdvertiserCardDto = {
  id: string;
  name: string;
  agencyName: string | null;
  bio: string | null;
  phone: string | null;
  listingCount: number;
};

export type ListingDetailDto = {
  id: string;
  title: string;
  description: string;
  listingType: ListingType;
  category: ListingCategory;
  price: number;
  pricePeriod: PricePeriod | null;
  availability: Availability;
  area: string | null;
  state: string | null;
  addressLine: string | null;
  propertyType: PropertyType;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  lotSizeSqm: number | null;
  yearBuilt: number | null;
  parking: number | null;
  furnished: boolean;
  latitude: number | null;
  longitude: number | null;
  amenities: string[];
  costs: CostDto[];
  media: MediaDto[];
  advertiser: AdvertiserDto;
  publishedAt: string | null;
  confirmedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
  pages: number;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  agencyName: string | null;
};

export type LocationDto = {
  id: string;
  slug: string;
  name: string;
  kind: LocationKind;
  parentSlug: string | null;
};

export type AmenityDto = {
  slug: string;
  label: string;
};

export type AreaDto = {
  slug: string;
  name: string;
  listingCount: number;
};

export type ProblemDetail = {
  type: string;
  title: string;
  status: number;
  detail: string;
  errors?: Record<string, string>;
};

export type ListingSearch = {
  q?: string;
  location?: string;
  advertiser?: string;
  ids?: string[];
  listingType?: ListingType;
  category?: ListingCategory;
  propertyType?: PropertyType;
  availability?: Availability;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  amenity?: string[];
  bbox?: string;
  polygon?: string;
  sort?: "newest" | "oldest" | "price-asc" | "price-desc" | "updated" | "confirmed" | "relevance";
  page?: number;
  size?: number;
};
