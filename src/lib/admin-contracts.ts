import type { VerificationDimension, VerificationDto } from "@/lib/api-types";

export const VERIFICATION_DIMENSIONS: { value: VerificationDimension; label: string }[] = [
  { value: "IDENTITY", label: "Advertiser identity" },
  { value: "BUSINESS", label: "Business / agency" },
  { value: "REGULATORY", label: "Regulatory information" },
  { value: "PROPERTY_EXISTENCE", label: "Property existence" },
  { value: "LOCATION", label: "Location" },
  { value: "AUTHORITY", label: "Advertiser authority" },
  { value: "PRICE", label: "Price confirmation" },
  { value: "AVAILABILITY", label: "Availability confirmation" },
  { value: "MEDIA_FRESHNESS", label: "Listing / media freshness" },
];

export const VERIFICATION_STATES = ["UNVERIFIED", "PENDING", "VERIFIED", "FAILED"] as const;

/** Which dimensions contribute to the four public verification booleans. */
export function publicSummaryFrom(dimensions: VerificationDto[]) {
  const stateOf = (dimension: VerificationDimension) =>
    dimensions.find((row) => row.dimension === dimension)?.state ?? "UNVERIFIED";
  return {
    advertiserVerified: stateOf("IDENTITY") === "VERIFIED" || stateOf("BUSINESS") === "VERIFIED",
    propertyVerified: stateOf("PROPERTY_EXISTENCE") === "VERIFIED",
    locationVerified: stateOf("LOCATION") === "VERIFIED",
    priceVerified: stateOf("PRICE") === "VERIFIED",
  };
}
