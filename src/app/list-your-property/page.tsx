import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, ClipboardCheck, MessageCircle, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ContentIcon } from "@/components/marketing/content-icon";
import { MarketingLink, MarketingPage, MarketingSection } from "@/components/marketing/marketing-page";
import { getContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "List your property",
  description: "Explore the Gida listing journey for landlords, agents and property developers.",
};

export default async function ListYourPropertyPage() {
  const listingBlock = await getContent("listing_steps");
  const landlordBlock = await getContent("landlord_paths");
  return (
    <MarketingPage
      eyebrow="For property owners"
      title="List the property once. Give the important details room to speak."
      description="Gida is being designed for landlords, agents and developers who need more than a headline price and a small image. This page outlines the intended listing journey without pretending that a browser listing editor exists yet."
    >
      <MarketingSection eyebrow="The listing path" title="Four stages, with a clear place for each decision">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {listingBlock.items.map((step, index) => (
            <Card key={step.label} className="h-full rounded-2xl">
              <CardContent className="pt-6">
                <div className="mb-5 flex items-center justify-between">
                  <ContentIcon name={step.iconName} className="h-7 w-7 text-accent" />
                  <span className="text-xs font-medium text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="font-heading text-lg font-semibold">{step.label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Choose the right representation" title="Different property owners need different context">
        <div className="grid gap-5 md:grid-cols-2">
          {landlordBlock.items.map((path) => (
            <div key={path.label} className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <ContentIcon name={path.iconName} className="mb-5 h-8 w-8 text-accent" />
              <h3 className="font-heading text-xl font-semibold">{path.label}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{path.body}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="A useful listing detail" title="The page should help someone decide what to do next">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [Building2, "Property context", "Type, location, size, furnishing, availability and amenities should live together."],
            [ClipboardCheck, "Cost context", "Disclosed fees and dates should be available without forcing a separate phone call."],
            [MessageCircle, "Enquiry context", "A future owner view should make enquiry and viewing-request expectations clear."],
          ].map(([Icon, title, body]) => {
            const ItemIcon = Icon as typeof Building2;
            return (
              <div key={title as string} className="rounded-2xl border border-border bg-card p-5">
                <ItemIcon className="mb-4 h-6 w-6 text-accent" aria-hidden="true" />
                <h3 className="font-semibold">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body as string}</p>
              </div>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="The next step" title="Explore the account flow">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <Upload className="mb-5 h-8 w-8 text-accent" aria-hidden="true" />
          <h2 className="font-heading text-2xl font-semibold">A browser listing editor is not available yet.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">You can create an account today, and published listings are served from the Gida API. A browser editor for creating and uploading listing photos is future work.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
            <MarketingLink href="/trust">See the trust model</MarketingLink>
          </div>
        </div>
      </MarketingSection>
    </MarketingPage>
  );
}
