import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  API_ORIGIN,
  API_PREFIX,
  REFRESH_COOKIE,
  isProduction,
  readProblem,
} from "@/lib/api-base";
import type { AuthUser, ProblemDetail } from "@/lib/api-types";
import { siteUrl } from "@/lib/site";

export type SpringResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; problem: ProblemDetail | null };

export type Session = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
};

export type RefreshOutcome = { ok: true; session: Session } | { ok: false };

type SpringInit = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

type SpringFormInit = {
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  form: FormData;
  token?: string | null;
};

export function problem(status: number, code: string, detail: string): ProblemDetail {
  return {
    type: `https://gida.ng/errors/${code}`,
    title: status === 403 ? "Forbidden" : status === 400 ? "Bad Request" : status === 401 ? "Unauthorized" : "Error",
    status,
    detail,
  };
}

export function problemResponse(status: number, code: string, detail: string): NextResponse {
  return NextResponse.json(problem(status, code, detail), {
    status,
    headers: { "content-type": "application/problem+json" },
  });
}

export function originAllowed(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === request.nextUrl.origin || origin === siteUrl.origin;
}

export async function springCall<T>(path: string, init: SpringInit): Promise<SpringResult<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.token) headers.Authorization = `Bearer ${init.token}`;

  let response: Response;
  try {
    response = await fetch(`${API_ORIGIN}${API_PREFIX}${path}`, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 502,
      problem: problem(502, "backend_unreachable", "The marketplace service is not reachable right now."),
    };
  }

  if (!response.ok) {
    return { ok: false, status: response.status, problem: await readProblem(response) };
  }
  if (response.status === 204) {
    return { ok: true, status: 204, data: undefined as T };
  }
  return { ok: true, status: response.status, data: (await response.json()) as T };
}

/**
 * Multipart twin of `springCall`: forwards a `FormData` body so the browser's
 * fetch sets the multipart boundary; no JSON content-type is sent. The type
 * parameter is the JSON shape Spring replies with (e.g. an uploaded MediaDto).
 */
export async function springForm<T>(path: string, init: SpringFormInit): Promise<SpringResult<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.token) headers.Authorization = `Bearer ${init.token}`;

  let response: Response;
  try {
    response = await fetch(`${API_ORIGIN}${API_PREFIX}${path}`, {
      method: init.method,
      headers,
      body: init.form,
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 502,
      problem: problem(502, "backend_unreachable", "The marketplace service is not reachable right now."),
    };
  }

  if (!response.ok) {
    return { ok: false, status: response.status, problem: await readProblem(response) };
  }
  if (response.status === 204) {
    return { ok: true, status: 204, data: undefined as T };
  }
  return { ok: true, status: response.status, data: (await response.json()) as T };
}

export type DashboardGuard = { ok: true; token: string } | { ok: false; response: NextResponse };

/** Origin + session gate shared by the dashboard listing routes. */
export async function guardDashboardWrite(request: NextRequest): Promise<DashboardGuard> {
  if (!originAllowed(request)) {
    return {
      ok: false,
      response: problemResponse(403, "origin_not_allowed", "This action must be performed from gida.ng."),
    };
  }
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return {
      ok: false,
      response: problemResponse(401, "signed_out", "Sign in to manage your listings."),
    };
  }
  return { ok: true, token };
}

export type AdminGuard = { ok: true; token: string } | { ok: false; response: NextResponse };

/** Origin + ADMIN session gate shared by the admin routes. */
export async function guardAdmin(request: NextRequest): Promise<AdminGuard> {
  if (!originAllowed(request)) {
    return {
      ok: false,
      response: problemResponse(403, "origin_not_allowed", "This action must be performed from gida.ng."),
    };
  }
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return { ok: false, response: problemResponse(401, "signed_out", "Sign in to review the marketplace.") };
  }
  const user = await springCall<AuthUser>("/auth/me", { method: "GET", token });
  if (!user.ok) {
    return { ok: false, response: problemResponse(401, "signed_out", "Sign in to review the marketplace.") };
  }
  if (user.data.role !== "ADMIN") {
    return { ok: false, response: problemResponse(403, "forbidden", "Admin access is required.") };
  }
  return { ok: true, token };
}

export type SpringFailure = Extract<SpringResult<unknown>, { ok: false }>;
/** Forwards a Spring problem (or a backend-unreachable fallback) to the browser. */
export function springErrorResponse(result: SpringFailure): NextResponse {
  return NextResponse.json(result.problem ?? problem(result.status, "backend_unreachable", "Try again."), {
    status: result.status,
    headers: { "content-type": "application/problem+json" },
  });
}

export function setSessionCookies(response: NextResponse, session: Session): void {
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: session.accessToken,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: session.expiresIn,
  });
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: session.refreshToken,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: session.refreshTokenExpiresIn,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    response.cookies.set({
      name,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction(),
      path: "/",
      maxAge: 0,
    });
  }
}

const inFlight = new Map<string, Promise<RefreshOutcome>>();

export function refreshOnce(refreshToken: string): Promise<RefreshOutcome> {
  const existing = inFlight.get(refreshToken);
  if (existing) return existing;
  const pending = performRefresh(refreshToken).finally(() => {
    inFlight.delete(refreshToken);
  });
  inFlight.set(refreshToken, pending);
  return pending;
}

async function performRefresh(refreshToken: string): Promise<RefreshOutcome> {
  const result = await springCall<Session>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
  if (!result.ok) return { ok: false };
  return { ok: true, session: result.data };
}

export type LoginResult = Session & { user: AuthUser };
