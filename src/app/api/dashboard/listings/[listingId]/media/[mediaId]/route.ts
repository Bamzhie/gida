import { NextResponse, type NextRequest } from "next/server";
import { guardDashboardWrite, problemResponse, springCall, springErrorResponse } from "@/lib/bff";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ listingId: string; mediaId: string }> };

/** DELETE /api/dashboard/listings/{id}/media/{mediaId} — remove a draft's media. */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const guard = await guardDashboardWrite(request);
  if (!guard.ok) return guard.response;

  const { listingId, mediaId } = await params;
  if (!UUID.test(listingId) || !UUID.test(mediaId)) {
    return problemResponse(400, "invalid_filter", "That listing or media id is not valid.");
  }

  const result = await springCall<void>(`/me/listings/${listingId}/media/${mediaId}`, {
    method: "DELETE",
    token: guard.token,
  });
  if (!result.ok) return springErrorResponse(result);
  return new NextResponse(null, { status: 204 });
}
