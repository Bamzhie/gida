import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/api-base";
import { clearSessionCookies, refreshOnce, setSessionCookies } from "@/lib/bff";

// Single-flight narrows the cross-tab rotation race but cannot remove it: two
// processes can still present the same refresh token, and Spring treats the
// second presentation as reuse and revokes the family.
export async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (access || !refresh) return NextResponse.next();

  const outcome = await refreshOnce(refresh);
  if (!outcome.ok) {
    const response = NextResponse.next();
    clearSessionCookies(response);
    return response;
  }

  const headers = new Headers(request.headers);
  headers.set("cookie", rebuildCookieHeader(request, outcome.session.accessToken, outcome.session.refreshToken));
  const response = NextResponse.next({ request: { headers } });
  setSessionCookies(response, outcome.session);
  return response;
}

function rebuildCookieHeader(request: NextRequest, accessToken: string, refreshToken: string): string {
  const pairs = request.cookies
    .getAll()
    .filter((cookie) => cookie.name !== ACCESS_COOKIE && cookie.name !== REFRESH_COOKIE)
    .map((cookie) => `${cookie.name}=${cookie.value}`);
  pairs.push(`${ACCESS_COOKIE}=${accessToken}`, `${REFRESH_COOKIE}=${refreshToken}`);
  return pairs.join("; ");
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
