import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/api-base";
import { originAllowed, problem, problemResponse, springCall } from "@/lib/bff";
import type { EnquiryCreatedDto } from "@/lib/api-types";

export async function POST(request: NextRequest) {
  if (!originAllowed(request)) {
    return problemResponse(403, "origin_not_allowed", "This form must be submitted from gida.ng.");
  }
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return problemResponse(400, "malformed_request", "The enquiry could not be read.");
  }
  const token = (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
  const result = await springCall<EnquiryCreatedDto>("/enquiries", { method: "POST", body: payload, token });
  if (!result.ok) {
    return NextResponse.json(result.problem ?? problem(result.status, "backend_unreachable", "Try again."), {
      status: result.status,
      headers: { "content-type": "application/problem+json" },
    });
  }
  return NextResponse.json(result.data, { status: 201 });
}
