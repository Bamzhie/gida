import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, ClipboardCheck, MessageCircle, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingLink, MarketingPage, MarketingSection } from "@/components/marketing/marketing-page";
import { LISTING_STEPS, LANDLORD_PATHS } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "List your property",
  description: "Explore the planned Gida listing journey for landlords, agents and property developers.",
};

export default function ListYourPropertyPage() {
  return (
    <MarketingPage
      eyebrow="For property owners"
      title="List the property once. Give the important details room to speak."
      description="Gida is being designed for landlords, agents and developers who need more than a headline price and a small image. This page outlines the intended listing journey without pretending that live publishing is connected yet."
    >
      <MarketingSection eyebrow="The listing path" title="Four stages, with a clear place for each decision">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LISTING_STEPS.map((step, index) => (
            <Card key={step.title} className="h-full rounded-2xl">
              <CardContent className="pt-6">
                <div className="mb-5 flex items-center justify-between">
                  <step.icon className="h-7 w-7 text-accent" aria-hidden="true" />
                  <span className="text-xs font-medium text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="font-heading text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Choose the right representation" title="Different property owners need different context">
        <div className="grid gap-5 md:grid-cols-2">
          {LANDLORD_PATHS.map((path) => (
            <div key={path.title} className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <path.icon className="mb-5 h-8 w-8 text-accent" aria-hidden="true" />
              <h3 className="font-heading text-xl font-semibold">{path.title}</h3>
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
          <h2 className="font-heading text-2xl font-semibold">The listing experience is not connected to a backend yet.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">You can preview the account form now. Live authentication, verification, photo uploads, publishing and advertiser notifications remain future work.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Preview account flow <ArrowRight className="h-4 w-4" />
            </Link>
            <MarketingLink href="/trust">See the trust model</MarketingLink>
          </div>
        </div>
      </MarketingSection>
    </MarketingPage>
  );
}
