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

/** A media entry the owner manages: adds the id needed to delete and reorder. */
export type ManagedMediaDto = MediaDto & { id: string };

export type MediaOrderItemDto = {
  id: string;
  sortOrder: number;
};

export type Lifecycle =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "PUBLISHED"
  | "PAUSED"
  | "EXPIRED"
  | "REJECTED"
  | "SUSPENDED";

export type ListingCreatedDto = {
  id: string;
  lifecycle: Lifecycle;
};

export type ListingRenewedDto = {
  id: string;
  expiresAt: string;
};

/** `GET /me/listings` row; the API infers SALE vs RENT from `pricePeriod`. */
export type OwnerListingDto = {
  id: string;
  title: string;
  lifecycle: Lifecycle;
  availability: Availability;
  price: number;
  pricePeriod: PricePeriod | null;
  createdAt: string;
  publishedAt: string | null;
  /** Latest rejection or correction request, so the owner knows why it is back in draft. */
  reviewNote: string | null;
};

/** `GET /me/advertiser-summary` — explainable rollup for the advertiser dashboard. */
export type AdvertiserSummaryDto = {
  listingsByState: Record<string, number>;
  totalEnquiries: number;
  totalViewingRequests: number;
  topListings: { listingId: string; title: string; enquiryCount: number }[];
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
  verified: boolean;
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

export type EnquiryCreatedDto = { id: string; createdAt: string };

export type EnquiryDto = {
  id: string;
  action: "CONTACT" | "VIEWING";
  name: string;
  contact: string;
  message: string | null;
  listingId: string | null;
  listingTitle: string | null;
  advertiserId: string | null;
  createdAt: string;
};

export type PropertyRequestDto = {
  id: string;
  title: string;
  listingType: ListingType;
  propertyType: PropertyType | null;
  area: string | null;
  areaId: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  furnished: boolean | null;
  neededBy: string | null;
  notes: string | null;
  name: string;
  contact: string;
  status: "OPEN" | "CLOSED";
  amenities: string[];
  createdAt: string;
};

export type MatchingRequestDto = Omit<PropertyRequestDto, "status" | "name" | "contact" | "createdAt"> & {
  matchedListingIds: string[];
  name: string;
  contact: string;
  createdAt: string;
};

export type RequestCreatedDto = { id: string; status: "OPEN" | "CLOSED"; createdAt: string };

export type ModerationActionDto = {
  id: string;
  action:
    | "APPROVE"
    | "REJECT"
    | "REQUEST_CORRECTIONS"
    | "SUSPEND_LISTING"
    | "REINSTATE_LISTING"
    | "FLAG_STALE"
    | "SUSPEND_USER"
    | "REINSTATE_USER"
    | "RESOLVE_REPORT"
    | "DISMISS_REPORT"
    | "VERIFY";
  targetType: "LISTING" | "USER" | "REPORT";
  targetId: string;
  actorId: string;
  actorName: string | null;
  reason: string | null;
  createdAt: string;
};

export type AdminListingDto = {
  id: string;
  title: string;
  lifecycle: Lifecycle;
  availability: Availability;
  price: number;
  pricePeriod: PricePeriod | null;
  advertiserId: string;
  advertiserName: string;
  advertiserEmail: string;
  area: string | null;
  state: string | null;
  submittedAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminListingDetail = {
  listing: ListingDetailDto;
  actions: ModerationActionDto[];
};

export type AdminUserDto = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
};

export type ReportReason = "FRAUD" | "WRONG_PRICE" | "UNAVAILABLE" | "DUPLICATE" | "OFFENSIVE" | "OTHER";

export type AdminReportDto = {
  id: string;
  listingId: string;
  listingTitle: string;
  reporterId: string;
  reporterEmail: string;
  reason: ReportReason;
  details: string | null;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type VerificationDimension =
  | "IDENTITY"
  | "BUSINESS"
  | "REGULATORY"
  | "PROPERTY_EXISTENCE"
  | "LOCATION"
  | "AUTHORITY"
  | "PRICE"
  | "AVAILABILITY"
  | "MEDIA_FRESHNESS";

export type VerificationDto = {
  dimension: VerificationDimension;
  state: "UNVERIFIED" | "PENDING" | "VERIFIED" | "FAILED";
  evidenceRef: string | null;
  notes: string | null;
  updatedAt: string;
};

export type VerificationSummary = {
  advertiserVerified: boolean;
  propertyVerified: boolean;
  locationVerified: boolean;
  priceVerified: boolean;
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
