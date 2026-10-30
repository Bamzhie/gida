import { apiGet } from "@/lib/api";

export const CONTENT_KEYS = [
  "trust_points",
  "audience_paths",
  "landlord_paths",
  "category_groups",
  "listing_steps",
  "search_steps",
  "contact_steps",
  "cost_guide_parts",
  "trust_checks",
] as const;

export type ContentKey = (typeof CONTENT_KEYS)[number];

export type ContentItemDto = {
  label: string;
  body: string | null;
  iconName: string | null;
  href: string | null;
  payload: Record<string, unknown>;
};

export type ContentBlockDto = {
  key: ContentKey;
  title: string | null;
  blurb: string | null;
  payload: Record<string, unknown>;
  items: ContentItemDto[];
};

/** Marketing copy changes on the order of weeks, so five minutes is the right staleness budget. */
export async function getContent(key: ContentKey): Promise<ContentBlockDto> {
  return apiGet<ContentBlockDto>(`/content/${key}`, {}, 300);
}

export function itemsOf(block: ContentBlockDto, kind?: string): ContentItemDto[] {
  return kind === undefined
    ? block.items
    : block.items.filter((item) => item.payload.kind === kind);
}
