import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  Search,
  MapPin,
  ArrowRight,
  Building2,
  Home,
  KeyRound,
  FileCheck,
  ShieldCheck,
  Receipt,
  Clock3,
  MapPinned,
  UserRound,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HeroSearch } from "@/components/marketplace/hero-search";
import { CostBreakdown } from "@/components/marketplace/cost-breakdown";
import { TrustList } from "@/components/marketplace/trust-list";

const CATEGORIES: { label: string; type: string; icon: LucideIcon }[] = [
  { label: "Apartments", type: "APARTMENT", icon: Building2 },
  { label: "Houses", type: "HOUSE", icon: Home },
  { label: "Townhouses", type: "TOWNHOUSE", icon: Building2 },
  { label: "Condos", type: "CONDO", icon: Building2 },
  { label: "Land", type: "LAND", icon: MapPinned },
  { label: "Commercial", type: "COMMERCIAL", icon: Building2 },
  { label: "New Homes", type: "", icon: Building2 },
  { label: "Short-let", type: "", icon: Clock3 },
];

const TRUST_POINTS = [
  { icon: ShieldCheck, title: "Checked, not just listed", body: "Every advertiser goes through a verification step before their listing goes live." },
  { icon: Receipt, title: "Fees on the page", body: "Agency fee, legal fee and deposit are shown next to the rent, not saved for a phone call." },
  { icon: Clock3, title: "You can see how fresh it is", body: "Every listing shows the last time its price and availability were actually confirmed." },
  { icon: MapPinned, title: "Lagos first", body: "We are live in Lagos now, and building out to the rest of Nigeria from here." },
];

const LISTING_STEPS = [
  { icon: FileCheck, title: "Register", body: "Create an account as an agent or landlord, it takes a couple of minutes." },
  { icon: KeyRound, title: "Verify", body: "Confirm who you are, so people can trust the listings with your name on them." },
  { icon: Building2, title: "List and publish", body: "Add your photos, price and availability, then publish when you are ready." },
  { icon: Search, title: "Manage enquiries", body: "Enquiries and viewing requests land in one place, not scattered across your phone." },
];

const AREAS = [
  "Lekki",
  "Victoria Island",
  "Ikoyi",
  "Ikeja GRA",
  "Yaba",
  "Surulere",
  "Ajah",
  "Magodo",
  "Gbagada",
  "Oniru",
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero — image runs full-bleed behind the sticky navbar above it */}
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
          {/* Darken top-down for the navbar, and bottom-up for the headline copy */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/10 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />

          {/* <div className="absolute top-24 right-6 sm:top-28 sm:right-8 flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 text-xs font-medium text-neutral-900 shadow-sm">
            <MapPin className="h-3.5 w-3.5" />
            Victoria Island, Lagos
          </div> */}

          <div className="container mx-auto relative z-10 flex flex-col flex-1 w-full px-6 sm:px-10 lg:px-14 pt-36 sm:pt-44 pb-10 sm:pb-12">
            <div className="text-white max-w-xl">
              <Badge
                variant="secondary"
                className="mb-5 w-fit px-3 py-1 text-sm gap-2 bg-white/95 text-neutral-900 hover:bg-white"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Nigeria&apos;s property marketplace
              </Badge>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.3rem] leading-[1.05] font-semibold">
                Find a home you won&apos;t have to second guess.
              </h1>
              <p className="mt-5 text-white/85 text-lg">
                We are building Gida to cover the whole country. Right now, that means real,
                verified listings across Lagos, with every fee shown before you go and inspect a
                place.
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
                <Link
                  href="#how-it-works"
                  className="text-sm font-medium text-white hover:text-white/70 transition-colors"
                >
                  See how it works
                </Link>
              </div>
            </div>

            <div className="mt-auto pt-10">
              <HeroSearch />
            </div>

            {/* Property Requests CTA */}
            <section className="py-12 md:py-16 bg-secondary/5">
              <div className="container mx-auto px-4 sm:px-10 lg:px-14">
                <div className="max-w-xl mx-auto text-center">
                  <h2 className="font-heading text-2xl font-semibold mb-3">Looking for something specific?</h2>
                  <p className="text-white/70 mb-6">
                    Tell us what you need and we'll connect you with listings (or agents) that match.
                  </p>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl px-6 py-3 text-lg"
                    asChild
                  >
                    <Link href="/requests">
                      Post a property request
                    </Link>
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* Trust band */}
      <section>
        <div className="bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {TRUST_POINTS.map((point) => (
              <div key={point.title}>
                <point.icon className="h-6 w-6 mb-3 opacity-80" />
                <h3 className="font-heading font-semibold mb-1">{point.title}</h3>
                <p className="text-sm opacity-75">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Discovery */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-10 lg:px-14">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-2xl font-semibold mb-3">Find a trusted agent</h2>
            <p className="text-white/70 mb-6">
              Work with verified estate agents and agencies across Lagos. Browse profiles,
              check specialisations, and contact them directly for your property needs.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl px-6 py-3 text-lg"
              asChild
            >
              <Link href="/agents">
                View agent directory
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-heading text-3xl font-semibold mb-2">What are you looking for</h2>
              <p className="text-muted-foreground">Search by the kind of place you actually want.</p>
            </div>
            <Link href="/listings" className="hidden sm:flex items-center gap-1 text-sm font-medium hover:text-accent">
              See all listings <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <Link key={cat.label} href={`/listings?${cat.type ? `propertyType=${cat.type}` : ""}`}>
                <div
                  className={`rounded-2xl border border-border p-4 flex flex-col items-center justify-between transition-colors hover:bg-secondary ${
                    cat.type
                      ? ""
                      : "opacity-70 cursor-not-allowed"
                  }`}
                >
                  <cat.icon className="h-5 w-5 mb-2 text-muted-foreground" />
                  <span className="font-medium text-sm line-clamp-1">{cat.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cost transparency */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <CostBreakdown />
            <div>
              <h2 className="font-heading text-3xl font-semibold mb-4">
                The rent is never the whole story
              </h2>
              <p className="text-muted-foreground mb-4">
                Anyone who has rented in Lagos knows the agency fee and legal fee can add up to
                as much as the rent itself. We think you should see that before you fall in love
                with a place, not after.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>Rent, agency fee, legal fee, deposit and service charge, each shown on its own line</li>
                <li>A total move in cost, worked out for you, not guessed</li>
                <li>A date next to the price, so you know how current it is</li>
                <li>If a fee has not been disclosed, we say so instead of leaving it off the page</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Two paths */}
      <section id="how-it-works" className="py-16 md:py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-semibold text-center mb-10">
            Whichever side of this you are on
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="rounded-2xl">
              <CardContent className="pt-6">
                <Search className="h-9 w-9 text-accent mb-3" />
                <h3 className="font-heading font-semibold text-lg mb-1">Looking for a home</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Search by area, filter by price and bedrooms, save what you like and message
                  the advertiser directly.
                </p>
                <Button variant="outline" className="rounded-xl" asChild>
                  <Link href="/listings">
                    Browse listings <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="pt-6">
                <Building2 className="h-9 w-9 text-accent mb-3" />
                <h3 className="font-heading font-semibold text-lg mb-1">Landlord or agent</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  List a property, manage enquiries and viewing requests, and build a track
                  record people can actually see.
                </p>
                <Button variant="outline" className="rounded-xl" asChild>
                  <Link href="/register">
                    Start listing <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Verification */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-8">
            <h2 className="font-heading text-3xl font-semibold mb-3">
              One badge was never going to cover it
            </h2>
            <p className="text-muted-foreground">
              A listing can be genuine in some ways and unconfirmed in others, so instead of one
              tick that means everything, we track each part separately.
            </p>
          </div>
          <TrustList />
        </div>
      </section>

      {/* Listing flow */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-semibold text-center mb-10">
            Listing something? Here is the path
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {LISTING_STEPS.map((step) => (
              <div key={step.title} className="rounded-2xl border border-border bg-card p-5">
                <step.icon className="h-7 w-7 text-accent mb-3" />
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nigeria wide, Lagos first */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="font-heading text-3xl font-semibold mb-4">
                Built for Nigeria, starting in Lagos
              </h2>
              <p className="text-muted-foreground mb-3">
                Gida is meant to work wherever you are in Nigeria, not just one city. We started
                in Lagos because it is where we could verify listings properly before opening
                things up further.
              </p>
              <p className="text-muted-foreground">
                If you are searching from somewhere outside Lagos, stick around. The plan is to
                bring the same approach, real listings, clear fees and honest verification, to
                the rest of the country as we grow.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-3">Currently covering these Lagos areas</p>
              <div className="flex flex-wrap gap-2">
                {AREAS.map((area) => (
                  <Link key={area} href={`/listings?city=${encodeURIComponent(area)}`}>
                    <Badge variant="outline" className="text-sm py-1.5 px-3 hover:bg-secondary rounded-full">
                      <MapPin className="h-3 w-3 mr-1" />
                      {area}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-16 md:pb-20 px-4">
        <div className="container mx-auto">
          <div className="rounded-[2rem] bg-primary text-primary-foreground px-6 sm:px-10 py-14 text-center">
            <h2 className="font-heading text-3xl font-semibold mb-3">Ready to look properly?</h2>
            <p className="opacity-80 max-w-xl mx-auto mb-7">
              Join the buyers, renters, landlords and agents already using Gida in Lagos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="secondary" className="rounded-xl" asChild>
                <Link href="/register">Get started</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-primary-foreground text-primary-foreground bg-primary-foreground/1 hover:bg-primary-foreground/10 "
                asChild
              >
                <Link href="/listings">Browse listings</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
