import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, MapPinned, Search, Send, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingLink, MarketingPage, MarketingSection } from "@/components/marketing/marketing-page";

export const metadata: Metadata = {
  title: "How Gida works",
  description: "A concise guide to the Gida property marketplace: search, agents, requests, maps and saved properties.",
};

const SEARCH_STEPS = [
  {
    icon: Search,
    title: "Start with a search",
    body: "Use the hero search to combine a Lagos area, keyword, property type, bedrooms, budget and rent-or-buy filter.",
  },
  {
    icon: MapPinned,
    title: "Narrow the area",
    body: "Use the map to draw a search area and inspect the homes inside it. The map runs the same listing search as the results page.",
  },
  {
    icon: Heart,
    title: "Save what matters",
    body: "Save a property to your browser-local favorites list, then open the saved-properties page to return to it.",
  },
];

const CONTACT_STEPS = [
  {
    icon: Send,
    title: "Ask a structured question",
    body: "A property request gives an advertiser-style flow a clear title, location, budget, amenities and contact fields.",
  },
  {
    icon: UserRound,
    title: "Find an agent profile",
    body: "Search agents and agencies by area, then open a profile to see the areas and specialities they cover.",
  },
];

function GuideCard({ icon: Icon, title, body }: (typeof SEARCH_STEPS)[number]) {
  return (
    <Card className="h-full rounded-2xl">
      <CardContent className="pt-6">
        <Icon className="mb-4 h-7 w-7 text-accent" aria-hidden="true" />
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

export default function HowItWorksPage() {
  return (
    <MarketingPage
      eyebrow="Product guide"
      title="A calmer way to move through the property search."
      description="Gida is being designed around the decisions people actually make online: find a place, understand the costs, check the context, and contact the right person. This page shows how those decisions fit together."
    >
      <MarketingSection
        eyebrow="For people searching"
        title="From a broad search to a shortlist"
        description="The home page stays intentionally short. The detailed paths live here so the first screen has room to focus on choosing a starting point."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {SEARCH_STEPS.map((step) => <GuideCard key={step.title} {...step} />)}
        </div>
        <div className="mt-7 flex flex-wrap gap-5">
          <MarketingLink href="/listings">Open the listings</MarketingLink>
          <MarketingLink href="/map">Open the map</MarketingLink>
          <MarketingLink href="/favorites">View saved properties</MarketingLink>
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="For people with a specific need"
        title="Requests and agent profiles are different paths"
        description="A property request helps someone describe a search. An agent profile helps someone understand who may be able to help. They should not be forced into the same form."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {CONTACT_STEPS.map((step) => <GuideCard key={step.title} {...step} />)}
        </div>
        <div className="mt-7 flex flex-wrap gap-5">
          <MarketingLink href="/requests">Post a property request</MarketingLink>
          <MarketingLink href="/agents">Browse agents</MarketingLink>
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="For property owners"
        title="Listing is a separate journey"
        description="The listing workflow is designed to be more than a form: an owner or developer needs a way to represent a property, its availability and the kind of interest it receives."
      >
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h3 className="font-heading text-xl font-semibold">See the listing path</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Explore how Gida plans to separate account setup, property context, listing preparation and enquiry management. Publishing and enquiry delivery are not connected yet.
          </p>
          <Link href="/list-your-property" className="mt-6 inline-flex items-center gap-2 rounded-xl text-sm font-medium text-primary hover:text-accent">
            Explore the listing path <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="What is connected"
        title="What works today?"
        description="Listings, search and accounts are served by the Gida API. Saved properties and enquiries stay in your browser because those writes are not connected yet."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-semibold">Connected here</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Search URLs, listing details, filters, maps, accounts and browser-local favorites.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-semibold">Not connected yet</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Advertiser enquiry delivery, verification checks, photo uploads and publishing.</p>
          </div>
        </div>
      </MarketingSection>
    </MarketingPage>
  );
}
