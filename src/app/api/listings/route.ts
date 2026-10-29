import { NextResponse, type NextRequest } from "next/server";
import { springCall } from "@/lib/bff";
import type { ListingSummaryDto, PageResponse } from "@/lib/api-types";

const ALLOWED = new Set([
  "q",
  "location",
  "ids",
  "listingType",
  "category",
  "propertyType",
  "availability",
  "minPrice",
  "maxPrice",
  "bedrooms",
  "bathrooms",
  "furnished",
  "amenity",
  "bbox",
  "polygon",
  "sort",
  "page",
  "size",
]);

export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  for (const [key, value] of request.nextUrl.searchParams) {
    if (ALLOWED.has(key)) params.append(key, value);
  }

  const query = params.toString();
  const result = await springCall<PageResponse<ListingSummaryDto>>(
    `/listings${query ? `?${query}` : ""}`,
    { method: "GET" }
  );

  if (!result.ok) {
    return NextResponse.json(result.problem ?? { detail: "Listings could not be loaded." }, {
      status: result.status,
      headers: { "content-type": "application/problem+json" },
    });
  }
  return NextResponse.json(result.data);
}
