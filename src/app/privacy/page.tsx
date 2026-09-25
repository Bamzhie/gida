import type { Metadata } from "next";
import { MarketingPage, MarketingSection } from "@/components/marketing/marketing-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How the Gida property marketplace will handle your personal data.",
};

export default function PrivacyPage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Privacy policy"
      description="Gida is currently a public preview, so this page describes what the preview stores today and what the live service will commit to, rather than the final policy."
    >
      <MarketingSection
        eyebrow="What happens today"
        title="This preview stores very little"
      >
        <div className="max-w-3xl space-y-4 text-muted-foreground">
          <p>
            The preview runs on local sample data. Saved properties, property requests, enquiries and viewing requests that
            you create here are kept only in your own browser and never leave your device. No sample action is shared with
            any landlord, agent or other user.
          </p>
          <p>
            Like most websites, the preview may receive standard technical information such as your IP address and browser
            type while pages load.
          </p>
        </div>
      </MarketingSection>
      <MarketingSection
        eyebrow="What comes later"
        title="The full policy"
      >
        <div className="max-w-3xl space-y-4 text-muted-foreground">
          <p>
            Before the live service launches, this page will describe how Gida collects, uses, stores and shares personal
            data, including compliance with the Nigeria Data Protection Act, your rights over your data, and how to contact
            us about privacy.
          </p>
        </div>
      </MarketingSection>
    </MarketingPage>
  );
}
