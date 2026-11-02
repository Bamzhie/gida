import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/api-base";
import { originAllowed, problem, springCall } from "@/lib/bff";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/listings/{id}/reports — a signed-in seeker reports a listing.
 * Reporting is deliberately authenticated: anonymous reporting is a spam
 * surface and rate limiting is not in this release.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  if (!originAllowed(request)) {
    return NextResponse.json(problem(403, "origin_not_allowed", "This form must be submitted from gida.ng."), {
      status: 403,
      headers: { "content-type": "application/problem+json" },
    });
  }
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(problem(401, "signed_out", "Sign in to report this listing."), {
      status: 401,
      headers: { "content-type": "application/problem+json" },
    });
  }

  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json(problem(400, "invalid_filter", "That listing id is not valid."), {
      status: 400,
      headers: { "content-type": "application/problem+json" },
    });
  }

  const body = (await request.json().catch(() => null)) as { reason?: unknown; details?: unknown } | null;
  if (!body || typeof body.reason !== "string") {
    return NextResponse.json(problem(400, "malformed_request", "Choose a reason for the report."), {
      status: 400,
      headers: { "content-type": "application/problem+json" },
    });
  }

  const result = await springCall<{ id: string; status: string }>(`/listings/${id}/reports`, {
    method: "POST",
    token,
    body: {
      reason: body.reason,
      details: typeof body.details === "string" && body.details.trim() ? body.details.trim() : null,
    },
  });
  if (!result.ok) {
    return NextResponse.json(result.problem ?? problem(result.status, "backend_unreachable", "Try again."), {
      status: result.status,
      headers: { "content-type": "application/problem+json" },
    });
  }
  return NextResponse.json(result.data, { status: 201 });
}
