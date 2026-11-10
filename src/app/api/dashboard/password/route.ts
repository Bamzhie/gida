import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookies, guardDashboardWrite, problemResponse, springCall, springErrorResponse } from "@/lib/bff";

export async function POST(request: NextRequest) {
  const guard = await guardDashboardWrite(request);
  if (!guard.ok) return guard.response;

  const payload = await request.json().catch(() => null);
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as { currentPassword?: unknown }).currentPassword !== "string" ||
    typeof (payload as { newPassword?: unknown }).newPassword !== "string"
  ) {
    return problemResponse(400, "malformed_request", "Enter your current password and a new password.");
  }

  const result = await springCall<void>("/auth/password", {
    method: "PUT",
    body: payload,
    token: guard.token,
  });
  if (!result.ok) return springErrorResponse(result);

  const response = new NextResponse(null, { status: 204 });
  clearSessionCookies(response);
  return response;
}
