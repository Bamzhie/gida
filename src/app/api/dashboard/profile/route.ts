import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/api-base";
import { guardDashboardWrite, problemResponse, springCall, springErrorResponse } from "@/lib/bff";
import type { AccountProfileDto } from "@/lib/api-types";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return problemResponse(401, "signed_out", "Sign in to manage your profile.");

  const result = await springCall<AccountProfileDto>("/me/profile", { method: "GET", token });
  if (!result.ok) return springErrorResponse(result);
  return NextResponse.json(result.data);
}

export async function PUT(request: NextRequest) {
  const guard = await guardDashboardWrite(request);
  if (!guard.ok) return guard.response;
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return problemResponse(400, "malformed_request", "The profile update could not be read.");
  }

  const result = await springCall<AccountProfileDto>("/me/profile", {
    method: "PUT",
    body: payload,
    token: guard.token,
  });
  if (!result.ok) return springErrorResponse(result);
  return NextResponse.json(result.data);
}
