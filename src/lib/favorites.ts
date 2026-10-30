import { cookies } from "next/headers";
import { apiGetAuthed } from "@/lib/api";
import { ACCESS_COOKIE } from "@/lib/api-base";
import type { ListingSummaryDto, PageResponse } from "@/lib/api-types";
import { toCardModel, type ListingCardModel } from "@/lib/listing-view";

export async function getFavoriteListings(): Promise<ListingCardModel[]> {
  const page = await apiGetAuthed<PageResponse<ListingSummaryDto>>("/me/favorites", { size: 100 });
  return page.items.map(toCardModel);
}

export async function getFavoriteIdSet(): Promise<Set<string>> {
  if (!(await cookies()).get(ACCESS_COOKIE)?.value) return new Set();
  try {
    return new Set((await getFavoriteListings()).map((listing) => listing.id));
  } catch {
    // A heart that cannot be confirmed shows as unsaved; the write will surface the real error.
    return new Set();
  }
}
