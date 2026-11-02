import { NextResponse, type NextRequest } from "next/server";
import { guardDashboardWrite, problemResponse, springCall, springErrorResponse } from "@/lib/bff";
import type { ListingCreatedDto } from "@/lib/api-types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ listingId: string }> };

/**
 * POST /api/dashboard/listings/{id}/submit — send a draft or a rejected listing
 * to the review queue. Submitting is not publishing: the listing stays invisible
 * to the public until an admin approves it.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const guard = await guardDashboardWrite(request);
  if (!guard.ok) return guard.response;

  const { listingId } = await params;
  if (!UUID.test(listingId)) {
    return problemResponse(400, "invalid_filter", "That listing id is not valid.");
  }

  const result = await springCall<ListingCreatedDto>(`/me/listings/${listingId}/submit`, {
    method: "POST",
    token: guard.token,
  });
  if (!result.ok) return springErrorResponse(result);
  return NextResponse.json(result.data, { status: 200 });
}
