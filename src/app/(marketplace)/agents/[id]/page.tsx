import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Building2, MapPin } from "lucide-react";
import { AgentContactForm } from "@/components/marketplace/agent-contact-form";
import { ListingCard } from "@/components/marketplace/listing-card";
import { RevealPhone } from "@/components/marketplace/reveal-phone";
import { Card, CardContent } from "@/components/ui/card";
import { getAdvertiser, initialsOf } from "@/lib/advertisers";
import { getFavoriteIdSet } from "@/lib/favorites";
import { searchListings } from "@/lib/listings";
import { toCardModel } from "@/lib/listing-view";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const advertiser = await getAdvertiser(id);
  if (!advertiser) return { title: "Advertiser not found" };
  return {
    title: advertiser.agencyName || advertiser.name,
    description: advertiser.bio || `Explore ${advertiser.listingCount} live listings from ${advertiser.name} on Gida.`,
  };
}

export default async function AdvertiserProfilePage({ params }: Props) {
  const { id } = await params;
  const advertiser = await getAdvertiser(id);
  if (!advertiser) notFound();

  const [listingPage, favorites] = await Promise.all([
    searchListings({ advertiser: id, size: 24 }),
    getFavoriteIdSet(),
  ]);
  const listings = listingPage.items.map(toCardModel);
  const locations = [...new Set(listings.flatMap((listing) => [listing.area, listing.state]).filter((value): value is string => Boolean(value)))];
  const agencyLabel = advertiser.agencyName?.trim() || advertiser.name;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-10">
      <Link href="/agents" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All advertisers
      </Link>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0">
          <header className="mb-9">
            <div className="mb-5 flex items-center gap-4">
              <div aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
                {initialsOf(agencyLabel)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-3xl font-bold leading-tight">{agencyLabel}</h1>
                  {advertiser.verified && <BadgeCheck className="size-5 text-accent" aria-label="Identity verified by Gida" />}
                </div>
                {advertiser.agencyName && <p className="mt-1 text-muted-foreground">{advertiser.name}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Building2 className="size-4" />{advertiser.listingCount} live {advertiser.listingCount === 1 ? "listing" : "listings"}</span>
              {locations.length > 0 && (
                <span className="inline-flex items-center gap-2"><MapPin className="size-4" />Listings in {locations.join(", ")}</span>
              )}
            </div>
          </header>

          <section aria-labelledby="agency-about">
            <h2 id="agency-about" className="mb-3 font-heading text-xl font-semibold">About {advertiser.agencyName || advertiser.name}</h2>
            <p className="max-w-3xl whitespace-pre-line leading-7 text-muted-foreground">
              {advertiser.bio || "This advertiser has not added an agency description yet."}
            </p>
          </section>

          <section aria-labelledby="advertiser-listings" className="mt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="advertiser-listings" className="font-heading text-2xl font-semibold">Listings from {advertiser.agencyName || advertiser.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Current homes published on Gida.</p>
              </div>
              <Link href={`/listings?advertiser=${advertiser.id}`} className="text-sm font-medium text-primary hover:underline">
                View all {listingPage.total} listings
              </Link>
            </div>
            {listings.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {listings.map((listing) => <ListingCard key={listing.id} listing={listing} saved={favorites.has(listing.id)} />)}
              </div>
            ) : (
              <Card><CardContent className="py-8 text-sm text-muted-foreground">There are no live listings to show right now.</CardContent></Card>
            )}
          </section>
        </main>

        <aside className="lg:sticky lg:top-24">
          <Card className="overflow-hidden rounded-2xl shadow-md">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                  {initialsOf(agencyLabel)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{agencyLabel}</p>
                  <p className="text-sm text-muted-foreground">Advertiser on Gida</p>
                </div>
              </div>
              <div className="space-y-3">
                <RevealPhone phone={advertiser.phone} className="w-full rounded-xl" />
                <AgentContactForm advertiserId={advertiser.id} advertiserName={advertiser.name} buttonLabel="Email advertiser" />
              </div>
              <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
                Messages sent here go to the advertiser&apos;s Gida inbox.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
