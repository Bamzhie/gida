import { apiGet } from "@/lib/api";
import type { VerificationSummary } from "@/lib/api-types";

/**
 * The public trust summary for a listing: exactly four booleans, no timestamps.
 * A dimension is `true` only when its stored row is VERIFIED, so a missing or
 * failed dimension reads as false rather than as a scare label.
 *
 * The endpoint 404s for a listing the public cannot see; the caller treats that
 * as "no badges" rather than an error, because the detail page has already
 * resolved visibility by the time it renders.
 */
export async function getVerificationSummary(listingId: string): Promise<VerificationSummary | null> {
  try {
    return await apiGet<VerificationSummary>(`/listings/${listingId}/verification`);
  } catch {
    return null;
  }
}

/** True when at least one dimension is verified, so the badge row is worth rendering. */
export function hasAnyVerification(summary: VerificationSummary | null): summary is VerificationSummary {
  if (!summary) return false;
  return (
    summary.advertiserVerified ||
    summary.propertyVerified ||
    summary.locationVerified ||
    summary.priceVerified
  );
}
