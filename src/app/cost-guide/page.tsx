import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, CircleHelp, FileText, Receipt } from "lucide-react";
import { CostBreakdown } from "@/components/marketplace/cost-breakdown";
import { MarketingLink, MarketingPage, MarketingSection } from "@/components/marketing/marketing-page";

export const metadata: Metadata = {
  title: "Property cost guide",
  description: "Understand how Gida plans to present rent, fees, deposits and listing costs in one transparent property view.",
};

const COST_PARTS = [
  {
    icon: Receipt,
    title: "The asking amount",
    body: "Rent or asking price is the anchor. The preview keeps it separate from the costs that may be added around it.",
  },
  {
    icon: Calculator,
    title: "The total picture",
    body: "A worked example can show the cost of moving in, subject to what the advertiser actually discloses.",
  },
  {
    icon: FileText,
    title: "The context",
    body: "Every sample amount is illustrative. The future service should make the source, date and status of each figure visible.",
  },
];

export default function CostGuidePage() {
  return (
    <MarketingPage
      eyebrow="Cost transparency"
      title="The rent is never the whole story."
      description="A property decision is easier when the important costs are visible before the phone call. Gida is being designed to keep those costs beside the property details instead of hiding them in a later conversation."
    >
      <MarketingSection
        eyebrow="A worked example"
        title="What the preview is trying to demonstrate"
        description="This is an illustrative example, not a quote for a live property. It shows how separate fees can be presented without pretending that every fee is universal."
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <CostBreakdown />
          <div className="space-y-4 text-muted-foreground">
            <p>
              The goal is not to make every property look the same. The goal is to make the information a person needs to make a decision easier to find.
            </p>
            <p>
              On a future listing page, the distinction between disclosed figures, estimates and unavailable information should remain visible.
            </p>
            <MarketingLink href="/listings">See the cost-aware listings preview</MarketingLink>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="The principles" title="What belongs beside the price">
        <div className="grid gap-5 md:grid-cols-3">
          {COST_PARTS.map((part) => {
            const Icon = part.icon;
            return (
              <div key={part.title} className="rounded-2xl border border-border bg-card p-6">
                <Icon className="mb-4 h-7 w-7 text-accent" aria-hidden="true" />
                <h3 className="font-heading text-lg font-semibold">{part.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{part.body}</p>
              </div>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Questions worth asking" title="The detail page should answer more than one question">
        <div className="space-y-3">
          {[
            "Is the amount shown yearly, monthly, one-off or negotiable?",
            "Which fees are disclosed, and which are not yet available?",
            "What would a person need to budget for before moving in?",
            "How recent is the information, and who supplied it?",
          ].map((question) => (
            <div key={question} className="flex gap-3 rounded-xl border border-border bg-card p-4">
              <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              <p className="text-sm font-medium">{question}</p>
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
          The sample listing details show how a cost breakdown sits alongside property facts, amenities and advertiser information.
        </p>
        <Link href="/listings" className="mt-6 inline-flex items-center gap-2 rounded-xl text-sm font-medium text-primary hover:text-accent">
          Explore listings <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </MarketingPage>
  );
}
