import { NextResponse, type NextRequest } from "next/server";
import { guardDashboardWrite, problemResponse, springCall, springErrorResponse } from "@/lib/bff";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ listingId: string }> };

/**
 * POST /api/dashboard/listings/{id}/confirm — the advertiser confirms a live
 * listing is still available. Stamps `last_confirmed_at`, which feeds the
 * "recently confirmed" sort and keeps the listing out of the stale queue.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const guard = await guardDashboardWrite(request);
  if (!guard.ok) return guard.response;

  const { listingId } = await params;
  if (!UUID.test(listingId)) {
    return problemResponse(400, "invalid_filter", "That listing id is not valid.");
  }

  const result = await springCall<{ confirmedAt: string }>(`/me/listings/${listingId}/confirm`, {
    method: "POST",
    token: guard.token,
  });
  if (!result.ok) return springErrorResponse(result);
  return NextResponse.json(result.data, { status: 200 });
}
