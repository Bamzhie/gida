import { cookies } from "next/headers";
import { apiGetAuthed } from "@/lib/api";
import { ACCESS_COOKIE } from "@/lib/api-base";
import type { AuthUser } from "@/lib/api-types";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  if (!store.get(ACCESS_COOKIE)?.value) return null;
  try {
    return await apiGetAuthed<AuthUser>("/auth/me");
  } catch {
    return null;
  }
}
