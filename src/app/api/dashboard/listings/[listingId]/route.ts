import { NextResponse, type NextRequest } from "next/server";
import { guardDashboardWrite, problemResponse, springCall, springErrorResponse } from "@/lib/bff";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ listingId: string }> };

/** PATCH /api/dashboard/listings/{id} — update listing fields the API allows. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const guard = await guardDashboardWrite(request);
  if (!guard.ok) return guard.response;

  const { listingId } = await params;
  if (!UUID.test(listingId)) {
    return problemResponse(400, "invalid_filter", "That listing id is not valid.");
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return problemResponse(400, "malformed_request", "The listing update could not be read.");
  }

  const result = await springCall<void>(`/listings/${listingId}`, {
    method: "PATCH",
    body: payload,
    token: guard.token,
  });
  if (!result.ok) return springErrorResponse(result);
  return new NextResponse(null, { status: 204 });
}
