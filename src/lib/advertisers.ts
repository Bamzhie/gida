import { apiGet } from "@/lib/api";
import type { AdvertiserCardDto, PageResponse } from "@/lib/api-types";

export async function searchAdvertisers(
  params: { q?: string; location?: string; page?: number; size?: number } = {},
  revalidate?: number
): Promise<PageResponse<AdvertiserCardDto>> {
  return apiGet<PageResponse<AdvertiserCardDto>>("/advertisers", params, revalidate);
}

export function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}
