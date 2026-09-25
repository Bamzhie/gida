import type { Metadata } from "next";
import { MarketingPage, MarketingSection } from "@/components/marketing/marketing-page";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that will govern the Gida property marketplace service.",
};

export default function TermsPage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Terms of service"
      description="Gida is currently a public preview, so this page is a placeholder rather than the final legal copy. The full terms will be published before the live service launches."
    >
      <MarketingSection
        eyebrow="What applies today"
        title="Preview usage"
      >
        <div className="max-w-3xl space-y-4 text-muted-foreground">
          <p>
            The listings, prices, fees, agents and verification details shown anywhere on this site are illustrative sample
            data. They are provided so you can explore how the product is meant to work, and they must not be relied on as
            real property, pricing or availability information.
          </p>
          <p>
            Sample enquiries, viewing requests, property requests and saved items are stored in your own browser only. No
            account created in this preview leads to a live conversation with a landlord, agent or developer.
          </p>
        </div>
      </MarketingSection>
      <MarketingSection
        eyebrow="What comes later"
        title="The full terms"
      >
        <div className="max-w-3xl space-y-4 text-muted-foreground">
          <p>
            Before the live service opens, this page will set out the real terms covering accounts, listings, advertiser
            obligations, enquiries and viewings, acceptable use, liability and how disputes are handled under Nigerian law.
          </p>
        </div>
      </MarketingSection>
    </MarketingPage>
  );
}
