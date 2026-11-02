import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { guardAdmin, problemResponse, springCall, springErrorResponse } from "@/lib/bff";
import type { VerificationDto } from "@/lib/api-types";
import { VERIFICATION_DIMENSIONS, VERIFICATION_STATES } from "@/lib/admin-contracts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DIMENSIONS = new Set<string>(VERIFICATION_DIMENSIONS.map(({ value }) => value));
const STATES = new Set<string>(VERIFICATION_STATES);

/**
 * PUT /api/admin/verifications — set one verification dimension.
 *
 * The API records a VERIFY audit row and validates that the subject exists, so
 * this route only shape-checks the request. A dimension is public-true only
 * when its stored state is VERIFIED; nothing here can claim more than that.
 */
export async function PUT(request: NextRequest) {
  const guard = await guardAdmin(request);
  if (!guard.ok) return guard.response;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const subjectType = typeof body?.subjectType === "string" ? body.subjectType.toUpperCase() : "";
  const subjectId = typeof body?.subjectId === "string" ? body.subjectId : "";
  const dimension = typeof body?.dimension === "string" ? body.dimension.toUpperCase() : "";
  const state = typeof body?.state === "string" ? body.state.toUpperCase() : "";

  if (subjectType !== "LISTING" && subjectType !== "ADVERTISER") {
    return problemResponse(422, "invalid_subject_type", "Subject must be a listing or an advertiser.");
  }
  if (!UUID.test(subjectId)) {
    return problemResponse(400, "invalid_filter", "That subject id is not valid.");
  }
  if (!DIMENSIONS.has(dimension)) {
    return problemResponse(422, "invalid_dimension", "Choose a verification dimension.");
  }
  if (!STATES.has(state)) {
    return problemResponse(422, "invalid_state", "Choose a verification state.");
  }

  const result = await springCall<VerificationDto>("/admin/verifications", {
    method: "PUT",
    token: guard.token,
    body: {
      subjectType,
      subjectId,
      dimension,
      state,
      evidenceRef: typeof body?.evidenceRef === "string" && body.evidenceRef.trim() ? body.evidenceRef.trim() : null,
      notes: typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    },
  });
  if (!result.ok) return springErrorResponse(result);

  revalidatePath("/admin/listings");
  return NextResponse.json(result.data, { status: 200 });
}
