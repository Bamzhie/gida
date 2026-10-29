import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/api-base";
import { problemResponse, springCall } from "@/lib/bff";
import type { AuthUser } from "@/lib/api-types";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return problemResponse(401, "signed_out", "No session is active.");
  }

  const result = await springCall<AuthUser>("/auth/me", { method: "GET", token });
  if (!result.ok) {
    return NextResponse.json(result.problem ?? { detail: "The session could not be read." }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
