import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { guardAdmin, problemResponse, springCall, springErrorResponse } from "@/lib/bff";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string; action: string }> };

/**
 * POST /api/admin/users/{id}/{suspend|reinstate} — account suspension.
 * Self-suspension is rejected by the API with cannot_suspend_self; the UI also
 * disables the control, but the API is the authority.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;

  const { id, action } = await params;
  if (!UUID.test(id)) {
    return problemResponse(400, "invalid_filter", "That user id is not valid.");
  }

  if (action !== "suspend" && action !== "reinstate") {
    return problemResponse(400, "invalid_filter", "Unknown user action.");
  }

  const body = (await request.json().catch(() => null)) as { reason?: unknown } | null;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (action === "suspend" && !reason) {
    return problemResponse(422, "reason_required", "Give a reason for the suspension.");
  }

  const result = await springCall<void>(`/admin/users/${id}/${action}`, {
    method: "POST",
    token: guard.token,
    body: reason ? { reason } : undefined,
  });
  if (!result.ok) return springErrorResponse(result);

  revalidatePath("/admin/users");
  return new NextResponse(null, { status: 204 });
}
