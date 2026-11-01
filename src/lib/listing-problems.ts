import type { ProblemDetail } from "@/lib/api-types";

/**
 * Problem-code toasts for the listing authoring and management flows. Codes
 * come from the API's problem `type` URI; unknown codes fall back to the
 * problem's own detail text.
 */
const MESSAGES: Record<string, string> = {
  signed_out: "Sign in to manage your listings.",
  not_owner: "You can only manage listings you own.",
  listing_not_found: "That listing no longer exists.",
  invalid_lifecycle_transition: "That action doesn't apply to this listing right now.",
  listing_locked: "Media can only change while the listing is a draft.",
  property_locked: "Property details can only change while the listing is a draft.",
  too_many_media: "A listing can hold at most 20 photos, videos and floor plans.",
  unsupported_media:
    "That file type isn't supported. Photos: JPG, PNG or WebP. Videos: MP4. Floor plans: PDF, PNG or JPG.",
  invalid_image: "That image could not be read. Try a different file.",
  invalid_price_period: "Rent listings need a pricing period; sale listings can't have one.",
  unknown_location: "Choose a location from the list.",
  unknown_amenity: "One of the selected amenities is no longer available.",
  duplicate_cost_type: "Each cost type can appear only once.",
  malformed_request: "The request could not be read. Try again.",
  backend_unreachable: "The marketplace service is not reachable right now.",
};

export function listingProblemMessage(problem: ProblemDetail | null): string {
  if (!problem) return "Something went wrong. Try again.";
  const code = problem.type.split("/").pop() ?? "";
  if (code === "validation_failed" && problem.errors) {
    const first = Object.values(problem.errors)[0];
    if (first) return first;
  }
  return MESSAGES[code] ?? problem.detail;
}
