import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ListingForm, emptyListingInitial } from "@/components/dashboard/listing-form";
import { getAmenities, getLocations } from "@/lib/listings";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New listing",
  description: "Draft a property listing for the Gida marketplace.",
};

export default async function NewListingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard/listings/new")}`);
  }
  if (user.role !== "AGENT" && user.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Building2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold">Listing is for advertiser accounts</h1>
        <p className="text-muted-foreground">
          Your account is a browser account, so it can save and enquire but not publish. Ask Gida to
          upgrade your account to an advertiser to list property.
        </p>
      </div>
    );
  }

  const [locations, amenities] = await Promise.all([getLocations(), getAmenities()]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 max-w-3xl">
        <h1 className="font-heading text-2xl font-bold">Draft a new listing</h1>
        <p className="mt-2 text-muted-foreground">
          Everything saves as a draft first. Photos, videos and floor plans are uploaded after the
          draft exists, and nothing goes public until you press publish.
        </p>
      </div>
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
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
