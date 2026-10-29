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
      description="Gida is in an early public phase, so this page describes what Gida stores today and what the live service will commit to, rather than the final policy."
    >
      <MarketingSection
        eyebrow="What happens today"
        title="What Gida stores today"
      >
        <div className="max-w-3xl space-y-4 text-muted-foreground">
          <p>
            Listings come from demo records in the Gida database. Saved properties, property requests, enquiries and viewing
            requests that you create here are kept only in your own browser and never leave your device. No enquiry or
            request is shared with any landlord, agent or other user.
          </p>
          <p>
            Accounts are the part that leaves your browser. When you sign up, the name, email address, phone number and
            password you enter are stored on the Gida server so you can sign in again. Creating an account does not start a
            listing, enquiry or agent relationship.
          </p>
          <p>
            Like most websites, the service may receive standard technical information such as your IP address and browser
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
