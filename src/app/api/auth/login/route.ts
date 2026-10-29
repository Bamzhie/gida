import { NextResponse, type NextRequest } from "next/server";
import { originAllowed, problemResponse, setSessionCookies, springCall, type LoginResult } from "@/lib/bff";

type LoginBody = { email?: unknown; password?: unknown };

export async function POST(request: NextRequest) {
  if (!originAllowed(request)) {
    return problemResponse(403, "origin_not_allowed", "This request did not come from the Gida app.");
  }

  const body = (await request.json().catch(() => null)) as LoginBody | null;
  if (typeof body?.email !== "string" || typeof body.password !== "string" || !body.email || !body.password) {
    return problemResponse(400, "validation_failed", "Email and password are required.");
  }

  const result = await springCall<LoginResult>("/auth/login", {
    method: "POST",
    body: { email: body.email, password: body.password },
  });
  if (!result.ok) {
    return NextResponse.json(result.problem ?? { detail: "Sign-in failed." }, { status: result.status });
  }

  const response = NextResponse.json({ user: result.data.user });
  setSessionCookies(response, result.data);
  return response;
}
