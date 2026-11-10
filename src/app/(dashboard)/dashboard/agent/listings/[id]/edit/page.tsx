import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ApiError, apiGetAuthed } from "@/lib/api";
import { API_ORIGIN } from "@/lib/api-base";
import { ListingForm, type ListingFormInitial } from "@/components/dashboard/listing-form";
import { ListingMediaManager } from "@/components/dashboard/listing-media-manager";
import { Badge } from "@/components/ui/badge";
import type { OwnerListingDetailDto } from "@/lib/api-types";
import type { ManagedMediaDto } from "@/lib/api-types";
import { getAmenities, getLocations } from "@/lib/listings";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Edit listing",
  description: "Edit one of your Gida listings.",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function initialFromDetail(dto: OwnerListingDetailDto["listing"], locations: Awaited<ReturnType<typeof getLocations>>): ListingFormInitial {
  const stateSlug = locations.find((location) => location.kind === "STATE" && location.name === dto.state)?.slug ?? "";
  const area = locations.find((location) =>
    (location.kind === "AREA" || location.kind === "ESTATE") && (dto.area ? location.name === dto.area : false)
  );
  const parent = area?.parentSlug ? locations.find((location) => location.slug === area.parentSlug) : undefined;
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
    lgaSlug: parent?.kind === "LGA" ? parent.slug : "",
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
    costs: dto.costs.map((cost) => ({ type: cost.type, amount: String(cost.amount), note: cost.note ?? "" })),
  };
}

export default async function EditAgentListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=" + encodeURIComponent("/dashboard/agent/listings/" + id + "/edit"));
  if (user.role !== "AGENT") redirect(user.role === "ADMIN" ? "/admin" : "/dashboard/buyer");
  if (!UUID.test(id)) notFound();

  let owned: OwnerListingDetailDto;
  try {
    owned = await apiGetAuthed<OwnerListingDetailDto>("/me/listings/" + id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [locations, amenities] = await Promise.all([getLocations(), getAmenities()]);
  const media = await apiGetAuthed<ManagedMediaDto[]>("/me/listings/" + id + "/media");
  const editableBeforeApproval = ["DRAFT", "REJECTED", "SUBMITTED", "UNDER_REVIEW"].includes(owned.lifecycle);
  const lifecycleBadge = owned.lifecycle === "PUBLISHED"
    ? { label: "Live", variant: "success" as const }
    : owned.lifecycle === "DRAFT"
      ? { label: "Draft", variant: "secondary" as const }
      : { label: owned.lifecycle === "REJECTED" ? "Needs changes" : "In review", variant: "warning" as const };

  return (
    <div>
      <Link href={"/dashboard/agent/listings/" + id} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Listing details
      </Link>
      <div className="mb-7 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">Edit listing</h2>
          <p className="mt-1 text-sm text-muted-foreground">{owned.listing.title}</p>
        </div>
        <Badge variant={lifecycleBadge.variant}>{lifecycleBadge.label}</Badge>
      </div>
      <ListingForm
        mode="edit"
        listingId={id}
        lifecycle={owned.lifecycle}
        structureLocked={!editableBeforeApproval}
        descriptionKnown
        initial={initialFromDetail(owned.listing, locations)}
        locations={locations}
        amenities={amenities}
      >
        {editableBeforeApproval && (
          <div className="border-t border-border pt-8">
            <ListingMediaManager listingId={id} mediaOrigin={API_ORIGIN} initialMedia={media} />
          </div>
        )}
      </ListingForm>
    </div>
  );
}
