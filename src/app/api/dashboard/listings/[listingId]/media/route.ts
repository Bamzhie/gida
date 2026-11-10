import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/api-base";
import { guardDashboardWrite, problemResponse, springCall, springErrorResponse, springForm } from "@/lib/bff";
import type { ManagedMediaDto } from "@/lib/api-types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ listingId: string }> };

/** GET /api/dashboard/listings/{id}/media — list owner-manageable media entries. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { listingId } = await params;
  if (!UUID.test(listingId)) {
    return problemResponse(400, "invalid_filter", "That listing id is not valid.");
  }
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return problemResponse(401, "signed_out", "Sign in to manage your listings.");
  }

  const result = await springCall<ManagedMediaDto[]>(`/me/listings/${listingId}/media`, {
    method: "GET",
    token,
  });
  if (!result.ok) return springErrorResponse(result);
  return NextResponse.json(result.data);
}

/**
 * POST /api/dashboard/listings/{id}/media — upload one file. The multipart
 * body is forwarded as FormData via `springForm` (no JSON content-type); the
 * draft-only rule and size/extension caps are enforced by the API.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const guard = await guardDashboardWrite(request);
  if (!guard.ok) return guard.response;

  const { listingId } = await params;
  if (!UUID.test(listingId)) {
    return problemResponse(400, "invalid_filter", "That listing id is not valid.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return problemResponse(400, "malformed_request", "The upload could not be read.");
  }

  const file = form.get("file");
  const kind = form.get("kind");
  if (!(file instanceof File) || typeof kind !== "string" || !kind.trim()) {
    return problemResponse(400, "malformed_request", "Attach a file and choose what it shows.");
  }

  const forward = new FormData();
  forward.append("file", file, file.name);
  forward.append("kind", kind.trim());

  const result = await springForm<ManagedMediaDto>(`/me/listings/${listingId}/media`, {
    method: "POST",
    form: forward,
    token: guard.token,
  });
  if (!result.ok) return springErrorResponse(result);
  return NextResponse.json(result.data, { status: 201 });
}
