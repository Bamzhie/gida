import type {
  AdvertiserDto,
  CostDto,
  CostType,
  ListingDetailDto,
  ListingSummaryDto,
  MediaDto,
} from "@/lib/api-types";
import { formatPrice, formatPricePeriod } from "@/lib/utils";

export type ListingCardModel = {
  id: string;
  title: string;
  listingType: ListingSummaryDto["listingType"];
  category: ListingSummaryDto["category"];
  propertyType: ListingSummaryDto["propertyType"];
  price: number;
  pricePeriod: ListingSummaryDto["pricePeriod"];
  availability: ListingSummaryDto["availability"];
  area: string | null;
  state: string | null;
  addressLine: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  latitude: number | null;
  longitude: number | null;
  primaryImage: { url: string; caption: string | null } | null;
  advertiser: AdvertiserDto;
  hasDisclosedFees: boolean;
  confirmedAt: string | null;
};

export type ListingDetailModel = ListingCardModel & {
  description: string;
  lotSizeSqm: number | null;
  yearBuilt: number | null;
  parking: number;
  furnished: boolean;
  amenities: string[];
  costs: CostDto[];
  media: MediaDto[];
  advertiser: AdvertiserDto;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const COST_LABELS: Record<CostType, string> = {
  AGENCY_FEE: "Agency fee",
  LEGAL_FEE: "Legal fee",
  SERVICE_CHARGE: "Service charge",
  CAUTION: "Caution / deposit",
  OTHER: "Other disclosed costs",
};

const SQM_TO_SQFT = 10.7639;

export function toCardModel(dto: ListingSummaryDto): ListingCardModel {
  return {
    id: dto.id,
    title: dto.title,
    listingType: dto.listingType,
    category: dto.category,
    propertyType: dto.propertyType,
    price: dto.price,
    pricePeriod: dto.pricePeriod,
    availability: dto.availability,
    area: dto.area,
    state: dto.state,
    addressLine: dto.addressLine,
    bedrooms: dto.bedrooms,
    bathrooms: dto.bathrooms,
    sizeSqm: dto.sizeSqm,
    latitude: dto.latitude,
    longitude: dto.longitude,
    primaryImage: dto.primaryImage,
    advertiser: dto.advertiser,
    hasDisclosedFees: dto.hasDisclosedFees,
    confirmedAt: dto.confirmedAt,
  };
}

export function toDetailModel(dto: ListingDetailDto): ListingDetailModel {
  const media = [...dto.media].sort((a, b) => a.sortOrder - b.sortOrder);
  const firstPhoto = media.find((item) => item.kind === "PHOTO");
  return {
    id: dto.id,
    title: dto.title,
    listingType: dto.listingType,
    category: dto.category,
    propertyType: dto.propertyType,
    price: dto.price,
    pricePeriod: dto.pricePeriod,
    availability: dto.availability,
    area: dto.area,
    state: dto.state,
    addressLine: dto.addressLine,
    bedrooms: dto.bedrooms,
    bathrooms: dto.bathrooms,
    sizeSqm: dto.sizeSqm,
    latitude: dto.latitude,
    longitude: dto.longitude,
    primaryImage: firstPhoto ? { url: firstPhoto.url, caption: firstPhoto.caption } : null,
    hasDisclosedFees: dto.costs.length > 0,
    confirmedAt: dto.confirmedAt,
    description: dto.description,
    lotSizeSqm: dto.lotSizeSqm,
    yearBuilt: dto.yearBuilt,
    parking: dto.parking ?? 0,
    furnished: dto.furnished,
    amenities: dto.amenities,
    costs: dto.costs,
    media,
    advertiser: dto.advertiser,
    publishedAt: dto.publishedAt,
    expiresAt: dto.expiresAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function listingPriceLabel(
  listing: Pick<ListingCardModel, "price" | "listingType" | "pricePeriod">
): string {
  const period = formatPricePeriod(listing);
  const suffix = period === "asking price" || period === "period not specified" ? "" : period;
  return `${formatPrice(listing.price)}${suffix}`;
}

export function disclosedTotal(listing: Pick<ListingDetailModel, "price" | "costs">): number {
  return listing.price + listing.costs.reduce((sum, cost) => sum + cost.amount, 0);
}

export function formatArea(sizeSqm: number | null): string | null {
  if (sizeSqm === null) return null;
  return `${Math.round(sizeSqm * SQM_TO_SQFT).toLocaleString("en-NG")} sqft`;
}
