import { NextResponse, type NextRequest } from "next/server";
import { originAllowed, problemResponse, springCall } from "@/lib/bff";

type RegisterBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  phone?: unknown;
  role?: unknown;
};

export async function POST(request: NextRequest) {
  if (!originAllowed(request)) {
    return problemResponse(403, "origin_not_allowed", "This request did not come from the Gida app.");
  }

  const body = (await request.json().catch(() => null)) as RegisterBody | null;
  if (
    typeof body?.name !== "string" ||
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    !body.name.trim() ||
    !body.email.trim() ||
    !body.password
  ) {
    return problemResponse(400, "validation_failed", "Name, email, and password are required.");
  }

  const result = await springCall<{ id: string; name: string; email: string; role: string }>("/auth/register", {
    method: "POST",
    body: {
      name: body.name.trim(),
      email: body.email.trim(),
      password: body.password,
      phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : undefined,
      role: body.role === "AGENT" ? "AGENT" : "USER",
    },
  });

  if (!result.ok) {
    return NextResponse.json(result.problem ?? { detail: "Registration failed." }, {
      status: result.status,
      headers: { "content-type": "application/problem+json" },
    });
  }
  return NextResponse.json(result.data, { status: 201 });
}
