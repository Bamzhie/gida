import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/api-base";
import { guardDashboardWrite, problemResponse, springCall, springErrorResponse } from "@/lib/bff";
import type { OwnerListingDetailDto } from "@/lib/api-types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ listingId: string }> };

/** GET /api/dashboard/listings/{id} — read one listing through its owner-scoped API. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { listingId } = await params;
  if (!UUID.test(listingId)) {
    return problemResponse(400, "invalid_filter", "That listing id is not valid.");
  }
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return problemResponse(401, "signed_out", "Sign in to manage your listings.");
  }

  const result = await springCall<OwnerListingDetailDto>("/me/listings/" + listingId, {
    method: "GET",
    token,
  });
  if (!result.ok) return springErrorResponse(result);
  return NextResponse.json(result.data);
}

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
