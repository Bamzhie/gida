import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ListingForm, type ListingFormInitial } from "@/components/dashboard/listing-form";
import { getAmenities, getLocations } from "@/lib/listings";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New listing",
  description: "Draft a property listing for the Gida marketplace.",
};

function emptyListingInitial(): ListingFormInitial {
  return {
    listingType: "SALE",
    category: "STANDARD",
    title: "",
    description: "",
    price: "",
    pricePeriod: "",
    availability: "AVAILABLE",
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

export default async function NewAgentListingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fdashboard%2Fagent%2Flistings%2Fnew");
  if (user.role !== "AGENT") redirect(user.role === "ADMIN" ? "/admin" : "/dashboard/buyer");

  const [locations, amenities] = await Promise.all([getLocations(), getAmenities()]);

  return (
    <div>
      <Link href="/dashboard/agent/listings" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> My listings
      </Link>
      <Card className="rounded-2xl">
        <CardContent className="p-6 sm:p-8">
          <section aria-labelledby="new-listing-heading" className="mb-8 border-b border-border pb-6">
            <h2 id="new-listing-heading" className="font-heading text-xl font-semibold">Draft a new listing</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Everything saves as a draft first. Add the property details, then upload photos, videos or floor plans before sending it for review.
            </p>
          </section>
          <ListingForm
            mode="create"
            lifecycle={null}
            structureLocked={false}
            descriptionKnown
            initial={emptyListingInitial()}
            locations={locations}
            amenities={amenities}
          />
        </CardContent>
      </Card>
    </div>
  );
}
