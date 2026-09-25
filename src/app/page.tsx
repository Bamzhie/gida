import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bath, Bed, Building2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeroSearch } from "@/components/marketplace/hero-search";
import { AUDIENCE_PATHS, LANDLORD_PATHS, TRUST_POINTS } from "@/lib/marketing-content";
import { CategoryBrowser } from "@/components/marketing/category-browser";
import { PREVIEW_PROPERTIES } from "@/lib/preview-data";
import { formatPrice } from "@/lib/utils";

const SITE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1572727850654-f50a7ead20df?auto=format&fit=crop&w=1200&h=630&q=85";

export const metadata: Metadata = {
  title: "Gida — Find a home in Lagos, without the guesswork",
  description:
    "A Lagos-first property marketplace preview. Search sample homes for rent and sale, with visible fees, clear listing status and honest freshness dates.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Gida — Find a home in Lagos, without the guesswork",
    description:
      "A Lagos-first property marketplace preview with visible fees, clear listing status and honest freshness dates.",
    type: "website",
    locale: "en_NG",
    siteName: "Gida",
    url: "/",
    images: [
      {
        url: HERO_IMAGE,
        width: 1200,
        height: 630,
        alt: "Residential towers in Victoria Island, Lagos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gida — Find a home in Lagos, without the guesswork",
    description:
      "A Lagos-first property marketplace preview with visible fees, clear listing status and honest freshness dates.",
    images: [HERO_IMAGE],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Gida",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/listings?keyword={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const FEATURED_PROPERTIES = [...PREVIEW_PROPERTIES]
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  .slice(0, 3);
const NEWEST_ID = FEATURED_PROPERTIES[0]?.id;
const RENT_COUNT = PREVIEW_PROPERTIES.filter((property) => property.listingType === "RENT").length;
const SALE_COUNT = PREVIEW_PROPERTIES.filter((property) => property.listingType === "SALE").length;
const AREA_COUNT = new Set(PREVIEW_PROPERTIES.map((property) => property.city)).size;

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="relative -mt-20">
        <div className="relative overflow-hidden min-h-[calc(83svh+5rem)] flex flex-col">
          <Image
            src="https://images.unsplash.com/photo-1572727850654-f50a7ead20df?auto=format&fit=crop&w=2600&h=1800&q=85"
            alt="Residential towers in Victoria Island, Lagos"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/10 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />

          <div className="container mx-auto relative z-10 flex flex-col flex-1 w-full px-6 sm:px-10 lg:px-14 pt-36 sm:pt-44 pb-10 sm:pb-12">
            <div className="text-white max-w-xl">
              <Badge
                variant="secondary"
                className="mb-5 w-fit px-3 py-1 text-sm gap-2 bg-white/95 text-neutral-900 hover:bg-white"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Nigeria&apos;s property marketplace preview
              </Badge>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.3rem] leading-[1.05] font-semibold">
                Find a home you won&apos;t have to second guess.
              </h1>
              <p className="text-white/85 text-lg">
                Explore a Lagos-first property marketplace preview. The listings, prices and verification details you see here are illustrative while the live service is being built.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  className="rounded-xl h-12 px-6 bg-white text-neutral-900 hover:bg-white/90"
                  asChild
                >
                  <Link href="/listings">
                    Explore Lagos listings <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Link href="/how-it-works" className="text-sm font-medium text-white hover:text-white/70 transition-colors">
                  Learn how Gida works
                </Link>
              </div>
            </div>

            <div className="mt-auto pt-10">
              <HeroSearch />
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 border-t border-border">
        <div className="container mx-auto px-4 sm:px-10 lg:px-14">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="mb-3 text-sm font-medium text-accent">Sample homes</p>
              <h2 className="font-heading text-3xl font-semibold mb-2">The latest places added to the preview.</h2>
              <p className="text-muted-foreground">Fresh sample listings from across Lagos, updated as the preview grows.</p>
            </div>
            <Link href="/listings" className="inline-flex items-center gap-1 text-sm font-medium hover:text-accent">
              See all listings <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {FEATURED_PROPERTIES.map((property) => {
              return (
                <Card key={property.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
                  <Link
                    href={`/listings/${property.id}`}
                    aria-label={`View ${property.title}`}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      {property.images[0] ? (
                        <Image
                          src={property.images[0].url}
                          alt={property.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <Building2 className="h-12 w-12 text-primary/30" aria-hidden="true" />
                      )}
                      <Badge className="absolute left-3 top-3" variant={property.listingType === "SALE" ? "default" : "secondary"}>
                        For {property.listingType === "SALE" ? "Sale" : "Rent"}
                      </Badge>
                      {property.id === NEWEST_ID && (
                        <Badge className="absolute right-3 top-3" variant="secondary">New</Badge>
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-lg font-bold text-primary">{formatPrice(property.price)}</span>
                        <Badge variant="outline">{property.propertyType}</Badge>
                      </div>
                      <h3 className="line-clamp-1 font-semibold">{property.title}</h3>
                      <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="line-clamp-1">{property.address}, {property.city}</span>
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        {property.bedrooms !== null && <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" aria-hidden="true" />{property.bedrooms} beds</span>}
                        {property.bathrooms !== null && <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" aria-hidden="true" />{property.bathrooms} baths</span>}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 border-t border-border">
        <div className="container mx-auto px-4 sm:px-10 lg:px-14">
          <div className="grid gap-6 md:grid-cols-3">
            {AUDIENCE_PATHS.map((path) => (
              <Link
                key={path.title}
                href={path.href}
                className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-secondary"
              >
                <path.icon className="h-7 w-7 text-accent mb-4" aria-hidden="true" />
                <h2 className="font-heading text-xl font-semibold">{path.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{path.body}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  {path.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 max-w-2xl">
            <h2 className="font-heading text-3xl font-semibold mb-2">What are you looking for?</h2>
            <p className="text-muted-foreground">
              Switch between renting and buying, then pick a property type. Every card opens the
              results for that exact combination.
            </p>
          </div>

          <CategoryBrowser counts={{ RENT: RENT_COUNT, SALE: SALE_COUNT }} />
        </div>
      </section>

      <section className="py-14 md:py-16 border-t border-border bg-secondary/40">
        <div className="container mx-auto px-4 sm:px-10 lg:px-14">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="mb-3 text-sm font-medium text-accent">For landlords, agents and developers</p>
              <h2 className="font-heading text-3xl font-semibold mb-3">Have a property to list?</h2>
              <p className="max-w-md text-muted-foreground">
                Preview how Gida will present your homes and developments — structured details, visible fees and a clear path to enquiries, all in one place.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-xl">
                  <Link href="/list-your-property">List your property <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/how-it-works">See the listing flow</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {LANDLORD_PATHS.map((path) => (
                <div key={path.title} className="rounded-2xl border border-border bg-card p-6">
                  <path.icon className="h-7 w-7 text-accent mb-4" aria-hidden="true" />
                  <h3 className="font-heading text-lg font-semibold">{path.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{path.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 border-t border-border">
        <div className="container mx-auto px-4 sm:px-10 lg:px-14">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="mb-3 text-sm font-medium text-accent">Trust, not guesswork</p>
              <h2 className="font-heading text-3xl font-semibold mb-2">The questions every renter asks, answered.</h2>
              <p className="text-muted-foreground">Gida is designed to show costs, status and freshness instead of hiding them behind one vague badge.</p>
            </div>
            <Link href="/trust" className="inline-flex items-center gap-1 text-sm font-medium hover:text-accent">
              Read the trust model <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_POINTS.map((point) => (
              <div key={point.title} className="rounded-2xl border border-border bg-card p-6">
                <point.icon className="h-6 w-6 text-accent mb-4" aria-hidden="true" />
                <h3 className="font-heading text-lg font-semibold">{point.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 border-t border-border">
        <div className="container mx-auto px-4 sm:px-10 lg:px-14">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="mb-3 text-sm font-medium text-accent">One place to start</p>
              <h2 className="font-heading text-3xl font-semibold mb-4">A clearer way to search Lagos property.</h2>
              <p className="max-w-xl text-muted-foreground">
                The detailed product story lives on its own pages, so this page stays focused on the choices that matter first: find a home, find an agent, or post a request.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-xl">
                  <Link href="/how-it-works">Read the product guide <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/trust">Explore the trust model</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <MapPin className="h-5 w-5 text-accent" aria-hidden="true" />
                <div>
                  <p className="font-heading font-semibold">Lagos first</p>
                  <p className="text-sm text-muted-foreground">Sample coverage in this preview</p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-secondary/60 p-3 text-center">
                  <dd className="font-heading text-xl font-semibold">{RENT_COUNT}</dd>
                  <dt className="text-xs text-muted-foreground">Sample rentals</dt>
                </div>
                <div className="rounded-xl bg-secondary/60 p-3 text-center">
                  <dd className="font-heading text-xl font-semibold">{SALE_COUNT}</dd>
                  <dt className="text-xs text-muted-foreground">Sample sales</dt>
                </div>
                <div className="rounded-xl bg-secondary/60 p-3 text-center">
                  <dd className="font-heading text-xl font-semibold">{AREA_COUNT}</dd>
                  <dt className="text-xs text-muted-foreground">Lagos areas</dt>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Lekki', 'Victoria Island', 'Ikoyi', 'Ikeja GRA', 'Yaba', 'Gbagada'].map((area) => (
                  <Link key={area} href={`/listings?city=${encodeURIComponent(area)}`}>
                    <Badge variant="outline" className="text-sm py-1.5 px-3 hover:bg-secondary rounded-full">
                      <MapPin className="h-3 w-3 mr-1" />{area}
                    </Badge>
                  </Link>
                ))}
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                Coverage expands only after the live service is ready. This preview uses local sample data.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16 md:pb-20 px-4">
        <div className="container mx-auto">
          <div className="rounded-[2rem] bg-primary text-primary-foreground px-6 sm:px-10 py-14 text-center">
            <Building2 className="mx-auto mb-4 h-8 w-8 opacity-80" aria-hidden="true" />
            <h2 className="font-heading text-3xl font-semibold mb-3">Ready to explore?</h2>
            <p className="opacity-80 max-w-xl mx-auto mb-7">Choose a path above, then explore the preview at your own pace.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="secondary" className="rounded-xl" asChild>
                <Link href="/listings">Explore listings</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-primary-foreground text-primary-foreground bg-primary-foreground/1 hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/how-it-works">How Gida works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
