import type { PropertyType } from "@/lib/api-types";

export const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "CONDO", label: "Condo" },
  { value: "LAND", label: "Land" },
  { value: "COMMERCIAL", label: "Commercial" },
];

/** `properties.furnished` is boolean, so Serviced is not a furnishing option here. */
export const FURNISHING_OPTIONS: { value: string; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "true", label: "Furnished" },
  { value: "false", label: "Unfurnished" },
];
