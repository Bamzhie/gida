import { NextResponse, type NextRequest } from "next/server";
import { guardDashboardWrite, problemResponse, springCall, springErrorResponse } from "@/lib/bff";
import type { ListingCreatedDto } from "@/lib/api-types";

/** POST /api/dashboard/listings — create a draft listing. */
export async function POST(request: NextRequest) {
  const guard = await guardDashboardWrite(request);
  if (!guard.ok) return guard.response;

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return problemResponse(400, "malformed_request", "The listing could not be read.");
  }

  const result = await springCall<ListingCreatedDto>("/listings", {
    method: "POST",
    body: payload,
    token: guard.token,
  });
  if (!result.ok) return springErrorResponse(result);
  return NextResponse.json(result.data, { status: 201 });
}
