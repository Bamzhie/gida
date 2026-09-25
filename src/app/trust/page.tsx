import type { Metadata } from "next";
import { Check, Info, ShieldCheck } from "lucide-react";
import { TrustList } from "@/components/marketplace/trust-list";
import { MarketingLink, MarketingPage, MarketingSection } from "@/components/marketing/marketing-page";

export const metadata: Metadata = {
  title: "Trust and listing status",
  description: "Learn how Gida plans to communicate listing status, freshness and verification without relying on one vague badge.",
};

export default function TrustPage() {
  return (
    <MarketingPage
      eyebrow="Trust model"
      title="One badge was never going to cover it."
      description="A property can be genuine in some ways and unconfirmed in others. Gida is being designed to show those differences clearly, so a user can understand what a listing page does and does not tell them."
    >
      <MarketingSection
        eyebrow="Status, not reassurance"
        title="Make the distinction visible"
        description="The current preview uses examples to show where a future listing might display advertiser checks, agency context, property visits, price confirmation and availability status."
      >
        <TrustList />
        <p className="mt-5 text-sm text-muted-foreground">
          These are illustrative examples. Live checks and verification services are not connected in this frontend phase.
        </p>
      </MarketingSection>

      <MarketingSection eyebrow="Three useful principles" title="What good status communication should do">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Separate the claims", "A price confirmation, a property visit and an advertiser check are different pieces of information."],
            ["Show the date", "A date beside a sample status helps a user understand how fresh the information is meant to be."],
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
            The sample detail page combines a preview listing badge, illustrative dates, a cost breakdown, amenities and advertiser information. The goal is context, not a single green tick.
          </p>
          <div className="mt-6 flex flex-wrap gap-5">
            <MarketingLink href="/listings/sample-1">Open a sample detail page</MarketingLink>
            <MarketingLink href="/cost-guide">Understand the cost view</MarketingLink>
          </div>
        </div>
      </MarketingSection>
    </MarketingPage>
  );
}
