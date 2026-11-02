import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { guardAdmin, problemResponse, springCall, springErrorResponse } from "@/lib/bff";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string; action: string }> };

const ACTIONS = new Set([
  "approve",
  "reject",
  "request-corrections",
  "suspend",
  "reinstate",
  "flag-stale",
]);

/** Actions that require a reason; the API rejects a blank one with reason_required. */
const REASON_REQUIRED = new Set(["reject", "request-corrections", "suspend"]);

/**
 * POST /api/admin/listings/{id}/{action} — one route for the six listing
 * moderation actions. Every action is audited by the API, so this route only
 * forwards; it never decides a transition itself.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;

  const { id, action } = await params;
  if (!UUID.test(id)) {
    return problemResponse(400, "invalid_filter", "That listing id is not valid.");
  }

  if (!ACTIONS.has(action)) {
    return problemResponse(400, "invalid_filter", "Unknown moderation action.");
  }

  const body = (await request.json().catch(() => null)) as { reason?: unknown } | null;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (REASON_REQUIRED.has(action) && !reason) {
    return problemResponse(422, "reason_required", "Give a reason so the advertiser knows what to fix.");
  }

  const result = await springCall<void>(`/admin/listings/${id}/${action}`, {
    method: "POST",
    token: guard.token,
    body: reason ? { reason } : undefined,
  });
  if (!result.ok) return springErrorResponse(result);

  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${id}`);
  return new NextResponse(null, { status: 204 });
}
