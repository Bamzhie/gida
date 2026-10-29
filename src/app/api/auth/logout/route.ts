import { NextResponse, type NextRequest } from "next/server";
import { REFRESH_COOKIE } from "@/lib/api-base";
import { clearSessionCookies, originAllowed, problemResponse, springCall } from "@/lib/bff";

export async function POST(request: NextRequest) {
  if (!originAllowed(request)) {
    return problemResponse(403, "origin_not_allowed", "This request did not come from the Gida app.");
  }

  // Revoking is idempotent and the browser session must end even if the API is down.
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await springCall<void>("/auth/logout", { method: "POST", body: { refreshToken } });
  }

  const response = new NextResponse(null, { status: 204 });
  clearSessionCookies(response);
  return response;
}
