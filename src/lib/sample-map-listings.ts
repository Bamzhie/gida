import type { MappedListing } from "@/lib/geo";
import { PREVIEW_PROPERTIES } from "@/lib/preview-data";
import { formatPrice, formatPricePeriod } from "@/lib/utils";

function toMapListing(property: (typeof PREVIEW_PROPERTIES)[number]): MappedListing {
  return {
    id: property.id,
    title: property.title,
    price: property.price,
    priceLabel: `${formatPrice(property.price)}${formatPricePeriod(property) === "asking price" ? "" : formatPricePeriod(property) === "period not specified" ? " · period n/s" : formatPricePeriod(property)}`,
    listingType: property.listingType,
    propertyType: property.propertyType,
    beds: property.bedrooms,
    baths: property.bathrooms,
    area: property.address,
    lat: property.latitude,
    lng: property.longitude,
  };
}

export const SAMPLE_MAP_LISTINGS: MappedListing[] = PREVIEW_PROPERTIES.map(toMapListing);

export const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];
