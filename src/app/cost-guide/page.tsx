import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleHelp } from "lucide-react";
import { CostBreakdown } from "@/components/marketplace/cost-breakdown";
import { ContentIcon } from "@/components/marketing/content-icon";
import { MarketingLink, MarketingPage, MarketingSection } from "@/components/marketing/marketing-page";
import { getListing, searchListings } from "@/lib/listings";
import { toDetailModel } from "@/lib/listing-view";
import { getContent, itemsOf } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Property cost guide",
  description: "Understand how Gida presents rent, fees, deposits and listing costs beside the property details.",
};

export default async function CostGuidePage() {
  const [page, block] = await Promise.all([
    searchListings({ location: "lekki-phase-1", listingType: "RENT", sort: "price-asc", size: 1 }),
    getContent("cost_guide_parts"),
  ]);
  const summary = page.items[0] ?? null;
  const fetched = summary ? await getListing(summary.id) : null;
  const detail = fetched ? toDetailModel(fetched) : null;
  const principles = itemsOf(block, "principle");
  const questions = itemsOf(block, "question");

  return (
    <MarketingPage
      eyebrow="Cost transparency"
      title="The rent is never the whole story."
      description="A property decision is easier when the important costs are visible before the phone call. Gida keeps those costs beside the property details instead of hiding them in a later conversation."
    >
      <MarketingSection
        eyebrow="A live example"
        title="What one real listing discloses"
        description="This is a live listing, priced as its advertiser disclosed it. Open it to see the same figures beside the property details."
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          {detail && (
            <CostBreakdown listing={detail} />
          )}
          <div className="space-y-4 text-muted-foreground">
            <p>
              The goal is not to make every property look the same. The goal is to make the information a person needs to make a decision easier to find.
            </p>
            <p>
              On the listing itself you see the same disclosed figures, the advertiser behind them and the date they were last confirmed.
            </p>
            <MarketingLink href="/listings">Browse listings with disclosed costs</MarketingLink>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="The principles" title="What belongs beside the price">
        <div className="grid gap-5 md:grid-cols-3">
          {principles.map((part) => (
            <div key={part.label} className="rounded-2xl border border-border bg-card p-6">
              <ContentIcon name={part.iconName} className="mb-4 h-7 w-7 text-accent" />
              <h3 className="font-heading text-lg font-semibold">{part.label}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{part.body}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Questions worth asking" title="The detail page should answer more than one question">
        <div className="space-y-3">
          {questions.map((question) => (
            <div key={question.label} className="flex gap-3 rounded-xl border border-border bg-card p-4">
              <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              <p className="text-sm font-medium">{question.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-5">
          <MarketingLink href="/trust">Learn about listing status</MarketingLink>
          <MarketingLink href="/how-it-works">Back to the product guide</MarketingLink>
        </div>
      </MarketingSection>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-heading text-2xl font-semibold">Want to see the numbers in context?</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Listing details show how a cost breakdown sits alongside property facts, amenities and advertiser information.
        </p>
        <Link href="/listings" className="mt-6 inline-flex items-center gap-2 rounded-xl text-sm font-medium text-primary hover:text-accent">
          Explore listings <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </MarketingPage>
  );
}
