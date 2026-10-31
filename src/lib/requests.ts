import { apiGetAuthed } from "@/lib/api";
import { ACCESS_COOKIE } from "@/lib/api-base";
import { cookies } from "next/headers";
import type { MatchingRequestDto, PageResponse, PropertyRequestDto } from "@/lib/api-types";

export async function getMyRequests(size = 10): Promise<PropertyRequestDto[]> {
  const page = await apiGetAuthed<PageResponse<PropertyRequestDto>>("/me/requests", { size });
  return page.items;
}

export async function getMatchingRequests(size = 10): Promise<MatchingRequestDto[]> {
  const page = await apiGetAuthed<PageResponse<MatchingRequestDto>>("/me/matching-requests", { size });
  return page.items;
}

export async function hasSession(): Promise<boolean> {
  return Boolean((await cookies()).get(ACCESS_COOKIE)?.value);
}
