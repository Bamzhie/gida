import { NextResponse, type NextRequest } from "next/server";
import { REFRESH_COOKIE } from "@/lib/api-base";
import {
  clearSessionCookies,
  originAllowed,
  problemResponse,
  setSessionCookies,
  springCall,
  type Session,
} from "@/lib/bff";

export async function POST(request: NextRequest) {
  if (!originAllowed(request)) {
    return problemResponse(403, "origin_not_allowed", "This request did not come from the Gida app.");
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return problemResponse(401, "signed_out", "No refresh token is stored.");
  }

  const result = await springCall<Session>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
  if (!result.ok) {
    const response = NextResponse.json(result.problem ?? { detail: "The session could not be refreshed." }, { status: result.status });
    clearSessionCookies(response);
    return response;
  }

  const response = NextResponse.json({ ok: true });
  setSessionCookies(response, result.data);
  return response;
}
