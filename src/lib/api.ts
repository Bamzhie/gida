import { cookies } from "next/headers";
import { ACCESS_COOKIE, readProblem, springUrl } from "@/lib/api-base";
import type { ProblemDetail } from "@/lib/api-types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ProblemDetail | null
  ) {
    super(problem?.detail ?? `Request failed with status ${status}`);
    this.name = "ApiError";
  }
}

export type QueryValue = string | number | boolean | undefined | null | readonly string[];
export type QueryParams = Record<string, QueryValue>;

export function toQueryString(params: QueryParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) search.append(key, item);
      }
      continue;
    }
    search.set(key, String(value));
  }
  return search.toString();
}

type FetchOptions = {
  token?: string | null;
  revalidate?: number;
};

async function apiFetch<T>(path: string, params: QueryParams, options: FetchOptions): Promise<T> {
  const query = toQueryString(params);
  const url = `${springUrl(path)}${query ? `?${query}` : ""}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const response = await fetch(url, {
    headers,
    ...(options.revalidate === undefined ? {} : { next: { revalidate: options.revalidate } }),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response));
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function apiGet<T>(path: string, params: QueryParams = {}, revalidate?: number): Promise<T> {
  return apiFetch<T>(path, params, { revalidate });
}

export async function apiGetAuthed<T>(path: string, params: QueryParams = {}): Promise<T> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
  return apiFetch<T>(path, params, { token });
}
