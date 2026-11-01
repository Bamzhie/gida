import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ListingForm, type ListingFormInitial } from "@/components/dashboard/listing-form";
import { ListingMediaManager } from "@/components/dashboard/listing-media-manager";
import { apiGetAuthed } from "@/lib/api";
import type {
  ListingDetailDto,
  OwnerListingDto,
  PageResponse,
} from "@/lib/api-types";
import { API_ORIGIN } from "@/lib/api-base";
import { getAmenities, getListing, getLocations } from "@/lib/listings";
import { resolveMediaUrl } from "@/lib/media";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit listing",
  description: "Edit one of your Gida listings.",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function initialFromDetail(dto: ListingDetailDto, locations: Awaited<ReturnType<typeof getLocations>>): ListingFormInitial {
  // The public detail carries area/state names; recover the slugs the cascade needs.
  const stateSlug = locations.find((l) => l.kind === "STATE" && l.name === dto.state)?.slug ?? "";
  const area = locations.find(
    (l) => (l.kind === "AREA" || l.kind === "ESTATE") && (dto.area ? l.name === dto.area : false)
  );
  const parent = area?.parentSlug
    ? locations.find((l) => l.slug === area.parentSlug)
    : undefined;
  const lgaSlug = parent?.kind === "LGA" ? parent.slug : "";
  return {
    listingType: dto.listingType,
    category: dto.category,
    title: dto.title,
    description: dto.description,
    price: String(dto.price),
    pricePeriod: dto.pricePeriod ?? "",
    availability: dto.availability,
    addressLine: dto.addressLine ?? "",
    stateSlug,
    lgaSlug,
    locationSlug: area?.slug ?? "",
    propertyType: dto.propertyType,
    bedrooms: dto.bedrooms === null ? "" : String(dto.bedrooms),
    bathrooms: dto.bathrooms === null ? "" : String(dto.bathrooms),
    sizeSqm: dto.sizeSqm === null ? "" : String(dto.sizeSqm),
    lotSizeSqm: dto.lotSizeSqm === null ? "" : String(dto.lotSizeSqm),
    yearBuilt: dto.yearBuilt === null ? "" : String(dto.yearBuilt),
    parking: dto.parking === null ? "" : String(dto.parking),
    furnished: dto.furnished ? "true" : "false",
    amenities: dto.amenities,
    costs: dto.costs.map((cost) => ({
      type: cost.type,
      amount: String(cost.amount),
      note: cost.note ?? "",
    })),
  };
}

function initialFromOwner(owned: OwnerListingDto): ListingFormInitial {
  // Owner rows carry no listingType; the API guarantees RENT always has a period.
  return {
    listingType: owned.pricePeriod ? "RENT" : "SALE",
    category: "",
    title: owned.title,
    description: "",
    price: String(owned.price),
    pricePeriod: owned.pricePeriod ?? "",
    availability: owned.availability,
    addressLine: "",
    stateSlug: "",
    lgaSlug: "",
    locationSlug: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
    sizeSqm: "",
    lotSizeSqm: "",
    yearBuilt: "",
    parking: "",
    furnished: "",
    amenities: [],
    costs: [],
  };
}

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/listings/${id}/edit`)}`);
  }
  if (user.role !== "AGENT" && user.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold">Listing is for advertiser accounts</h1>
        <p className="text-muted-foreground">
          Your account is a browser account, so it can save and enquire but not publish.
        </p>
      </div>
    );
  }
  if (!UUID.test(id)) notFound();

  // The public detail only exists for live listings; drafts fall through to the owner list.
  const detail = await getListing(id);
  const owned = detail
    ? null
    : (await apiGetAuthed<PageResponse<OwnerListingDto>>("/me/listings", { size: 100 }).catch(() => null))
        ?.items.find((item) => item.id === id) ?? null;
  if (!detail && !owned) notFound();

  const [locations, amenities] = await Promise.all([getLocations(), getAmenities()]);

  return (
    <div className="container mx-auto px-4 py-10">
      <Link
        href="/dashboard/listings"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> My listings
      </Link>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-bold">Edit listing</h1>
        {detail && <Badge variant="success">Live</Badge>}
        {owned && <Badge variant={owned.lifecycle === "DRAFT" ? "secondary" : "warning"}>{owned.lifecycle === "DRAFT" ? "Draft" : "Paused"}</Badge>}
      </div>
      <div className="space-y-8">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <ListingForm
              mode="edit"
              listingId={id}
              lifecycle={detail ? "PUBLISHED" : owned!.lifecycle}
              structureLocked
              descriptionKnown={Boolean(detail)}
              initial={detail ? initialFromDetail(detail, locations) : initialFromOwner(owned!)}
              locations={locations}
              amenities={amenities}
            />
          </CardContent>
        </Card>
        {detail && detail.media.length > 0 && (
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <h2 className="font-heading text-lg font-semibold">Attached media</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Media is locked while the listing is live. A duplicate starts as a draft you can
                re-attach files to.
              </p>
              <ul className="mt-4 flex flex-wrap gap-3">
                {detail.media.map((item) => (
                  <li
                    key={item.url}
                    className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/40 text-xs text-muted-foreground"
                  >
                    {item.kind === "VIDEO" ? (
                      <span className="px-2 text-center">Video</span>
                    ) : item.kind === "FLOOR_PLAN" ? (
                      <span className="px-2 text-center">Floor plan</span>
                    ) : (
                      /* Backend-served media lives on another origin; next/image cannot be configured for it. */
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveMediaUrl(API_ORIGIN, item.url)} alt={item.caption ?? "Listing photo"} className="h-full w-full object-cover" />
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {owned?.lifecycle === "DRAFT" && (
          <Card className="rounded-2xl">
            <CardContent className="pt-6">
              <ListingMediaManager listingId={id} mediaOrigin={API_ORIGIN} initialMedia={[]} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
