import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/api-base";
import { originAllowed, problem, springCall } from "@/lib/bff";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ listingId: string }> };

async function write(request: NextRequest, { params }: RouteContext, method: "PUT" | "DELETE") {
  if (!originAllowed(request)) {
    return NextResponse.json(problem(403, "origin_not_allowed", "This form must be submitted from gida.ng."), {
      status: 403,
      headers: { "content-type": "application/problem+json" },
    });
  }
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(problem(401, "signed_out", "Sign in to save properties."), {
      status: 401,
      headers: { "content-type": "application/problem+json" },
    });
  }
  const { listingId } = await params;
  if (!UUID.test(listingId)) {
    return NextResponse.json(problem(400, "invalid_filter", "That property id is not valid."), {
      status: 400,
      headers: { "content-type": "application/problem+json" },
    });
  }

  const result = await springCall<void>(`/me/favorites/${listingId}`, { method, token });
  if (result.ok) return new NextResponse(null, { status: 204 });
  return NextResponse.json(result.problem ?? problem(result.status, "backend_unreachable", "Try again."), {
    status: result.status,
    headers: { "content-type": "application/problem+json" },
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return write(request, context, "PUT");
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return write(request, context, "DELETE");
}
