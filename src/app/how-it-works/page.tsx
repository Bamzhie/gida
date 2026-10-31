import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ContentIcon } from "@/components/marketing/content-icon";
import { MarketingLink, MarketingPage, MarketingSection } from "@/components/marketing/marketing-page";
import { getContent } from "@/lib/content";
import type { ContentItemDto } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How Gida works",
  description: "A concise guide to the Gida property marketplace: search, agents, requests, maps and saved properties.",
};

function GuideCard({ item }: { item: ContentItemDto }) {
  return (
    <Card className="h-full rounded-2xl">
      <CardContent className="pt-6">
        <ContentIcon name={item.iconName} className="mb-4 h-7 w-7 text-accent" />
        <h3 className="font-heading text-lg font-semibold">{item.label}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
      </CardContent>
    </Card>
  );
}

export default async function HowItWorksPage() {
  const searchBlock = await getContent("search_steps");
  const contactBlock = await getContent("contact_steps");
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
          {searchBlock.items.map((step) => <GuideCard key={step.label} item={step} />)}
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
          {contactBlock.items.map((step) => <GuideCard key={step.label} item={step} />)}
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
            Account setup, property context, listing preparation and enquiry management are separate steps. Publishing runs through the Gida API today; a browser listing editor does not.
          </p>
          <Link href="/list-your-property" className="mt-6 inline-flex items-center gap-2 rounded-xl text-sm font-medium text-primary hover:text-accent">
            Explore the listing path <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="What is connected"
        title="What works today?"
        description="Listings, search, accounts, saved properties, enquiries and property requests are all served by the Gida API."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-semibold">Connected here</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Search URLs, listing details, filters, maps, accounts, saved properties, enquiries and requests.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-semibold">Not connected yet</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Independent verification checks and a browser listing editor with photo uploads.</p>
          </div>
        </div>
      </MarketingSection>
    </MarketingPage>
  );
}
