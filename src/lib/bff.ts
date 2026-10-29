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
