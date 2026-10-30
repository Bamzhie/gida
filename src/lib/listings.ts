import { ApiError, apiGet } from "@/lib/api";
import type {
  AdvertiserCardDto,
  AmenityDto,
  ListingDetailDto,
  ListingSearch,
  ListingSummaryDto,
  LocationDto,
  PageResponse,
} from "@/lib/api-types";

export async function searchListings(
  search: ListingSearch = {},
  revalidate?: number
): Promise<PageResponse<ListingSummaryDto>> {
  return apiGet<PageResponse<ListingSummaryDto>>(
    "/listings",
    {
      q: search.q,
      location: search.location,
      ids: search.ids,
      listingType: search.listingType,
      category: search.category,
      propertyType: search.propertyType,
      availability: search.availability,
      minPrice: search.minPrice,
      maxPrice: search.maxPrice,
      bedrooms: search.bedrooms,
      bathrooms: search.bathrooms,
      furnished: search.furnished,
      amenity: search.amenity,
      bbox: search.bbox,
      polygon: search.polygon,
      sort: search.sort,
      page: search.page,
      size: search.size,
    },
    revalidate
  );
}

export async function getListing(id: string): Promise<ListingDetailDto | null> {
  try {
    return await apiGet<ListingDetailDto>(`/listings/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getSimilarListings(id: string, limit = 3): Promise<ListingSummaryDto[]> {
  try {
    return await apiGet<ListingSummaryDto[]>(`/listings/${encodeURIComponent(id)}/similar`, { limit });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return [];
    throw error;
  }
}

export async function getLocations(): Promise<LocationDto[]> {
  return apiGet<LocationDto[]>("/locations");
}

export async function getAmenities(): Promise<AmenityDto[]> {
  return apiGet<AmenityDto[]>("/amenities");
}

export async function searchAdvertisers(
  params: { q?: string; location?: string; page?: number; size?: number } = {},
  revalidate?: number
): Promise<PageResponse<AdvertiserCardDto>> {
  return apiGet<PageResponse<AdvertiserCardDto>>("/advertisers", params, revalidate);
}

export async function getAmenityLabels(): Promise<Record<string, string>> {
  try {
    const amenities = await getAmenities();
    return Object.fromEntries(amenities.map((amenity) => [amenity.slug, amenity.label]));
  } catch {
    return {};
  }
}
