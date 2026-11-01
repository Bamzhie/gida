import { NextResponse, type NextRequest } from "next/server";
import { guardDashboardWrite, problemResponse, springCall, springErrorResponse } from "@/lib/bff";
import type { ManagedMediaDto, MediaOrderItemDto } from "@/lib/api-types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ listingId: string }> };

/** PUT /api/dashboard/listings/{id}/media/order — rewrite the draft's media order. */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const guard = await guardDashboardWrite(request);
  if (!guard.ok) return guard.response;

  const { listingId } = await params;
  if (!UUID.test(listingId)) {
    return problemResponse(400, "invalid_filter", "That listing id is not valid.");
  }

  const payload: unknown = await request.json().catch(() => null);
  if (
    !Array.isArray(payload)
    || payload.some(
      (item) =>
        !item || typeof item !== "object" || typeof (item as MediaOrderItemDto).id !== "string"
        || typeof (item as MediaOrderItemDto).sortOrder !== "number"
    )
  ) {
    return problemResponse(400, "malformed_request", "The media order could not be read.");
  }

  const result = await springCall<ManagedMediaDto[]>(`/me/listings/${listingId}/media/order`, {
    method: "PUT",
    body: payload as MediaOrderItemDto[],
    token: guard.token,
  });
  if (!result.ok) return springErrorResponse(result);
  return NextResponse.json(result.data, { status: 200 });
}
