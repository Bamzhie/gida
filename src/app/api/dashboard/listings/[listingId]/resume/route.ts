import { NextResponse, type NextRequest } from "next/server";
import { guardDashboardWrite, problemResponse, springCall, springErrorResponse } from "@/lib/bff";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ listingId: string }> };

/**
 * POST /api/dashboard/listings/{id}/resume — put a paused listing back live.
 * Only PAUSED rows resume; a suspended listing is admin-controlled and is
 * rejected by the API with invalid_lifecycle_transition.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const guard = await guardDashboardWrite(request);
  if (!guard.ok) return guard.response;

  const { listingId } = await params;
  if (!UUID.test(listingId)) {
    return problemResponse(400, "invalid_filter", "That listing id is not valid.");
  }

  const result = await springCall<void>(`/me/listings/${listingId}/resume`, {
    method: "POST",
    token: guard.token,
  });
  if (!result.ok) return springErrorResponse(result);
  return new NextResponse(null, { status: 204 });
}
