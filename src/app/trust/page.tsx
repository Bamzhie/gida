import type { Metadata } from "next";
import { Check, Info, ShieldCheck } from "lucide-react";
import { TrustList } from "@/components/marketplace/trust-list";
import { MarketingLink, MarketingPage, MarketingSection } from "@/components/marketing/marketing-page";
import { getContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trust and listing status",
  description: "Learn what Gida shows about listing status, freshness and verification, and what it leaves to the advertiser.",
};

export default async function TrustPage() {
  const checks = await getContent("trust_checks");
  return (
    <MarketingPage
      eyebrow="Trust model"
      title="One badge was never going to cover it."
      description="A property can be genuine in some ways and unconfirmed in others. Gida shows those differences clearly, so a user can understand what a listing page does and does not tell them."
    >
      <MarketingSection
        eyebrow="Status, not reassurance"
        title="Make the distinction visible"
        description="A listing can display advertiser checks, agency context, property visits, price confirmation and availability status as separate pieces of information."
      >
        <TrustList items={checks.items} />
      </MarketingSection>

      <MarketingSection eyebrow="Three useful principles" title="What good status communication should do">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Separate the claims", "A price confirmation, a property visit and an advertiser check are different pieces of information."],
            ["Show the date", "A date beside a status helps a user understand how fresh that information is."],
            ["Allow unknowns", "It is better to say that a check is not available than to imply that it passed."],
          ].map(([title, body], index) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                {index === 0 ? <Check className="h-5 w-5" /> : index === 1 ? <Info className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
              </div>
              <h3 className="font-heading text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="See the status in context" title="A listing should explain itself">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="max-w-2xl text-muted-foreground">
            A listing page combines the price, disclosed costs, amenities and advertiser information with dated status. The goal is context, not a single green tick.
          </p>
          <div className="mt-6 flex flex-wrap gap-5">
            <MarketingLink href="/listings">Browse live listings</MarketingLink>
            <MarketingLink href="/cost-guide">Understand the cost view</MarketingLink>
          </div>
        </div>
      </MarketingSection>
    </MarketingPage>
  );
}
