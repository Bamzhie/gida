import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { guardAdmin, problemResponse, springCall, springErrorResponse } from "@/lib/bff";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/reports/{id}/resolve — close a report as RESOLVED (action
 * taken) or DISMISSED (no action). The optional note is stored on the audit row.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  if (!UUID.test(id)) {
    return problemResponse(400, "invalid_filter", "That report id is not valid.");
  }

  const body = (await request.json().catch(() => null)) as { outcome?: unknown; note?: unknown } | null;
  const outcome = typeof body?.outcome === "string" ? body.outcome.toUpperCase() : "";
  if (outcome !== "RESOLVED" && outcome !== "DISMISSED") {
    return problemResponse(422, "invalid_outcome", "Choose resolve or dismiss.");
  }
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim() : null;

  const result = await springCall<void>(`/admin/reports/${id}/resolve`, {
    method: "POST",
    token: guard.token,
    body: { outcome, note },
  });
  if (!result.ok) return springErrorResponse(result);

  revalidatePath("/admin/reports");
  return new NextResponse(null, { status: 204 });
}
