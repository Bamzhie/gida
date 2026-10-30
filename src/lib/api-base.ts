import type { ProblemDetail } from "@/lib/api-types";

export const API_ORIGIN = process.env.API_BASE_URL ?? "http://localhost:8080";
export const API_PREFIX = "/api/v1";
export const ACCESS_COOKIE = "gida_access";
export const REFRESH_COOKIE = "gida_refresh";

export function springUrl(path: string): string {
  return `${API_ORIGIN}${API_PREFIX}${path}`;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function readProblem(response: Response): Promise<ProblemDetail | null> {
  try {
    const body = (await response.json()) as Partial<ProblemDetail>;
    if (body && typeof body.type === "string" && typeof body.detail === "string") {
      return body as ProblemDetail;
    }
    return null;
  } catch {
    return null;
  }
}

export function problemCode(body: unknown): string {
  if (body && typeof body === "object" && "type" in body && typeof (body as { type: unknown }).type === "string") {
    return (body as { type: string }).type.split("/").pop() ?? "";
  }
  return "";
}
