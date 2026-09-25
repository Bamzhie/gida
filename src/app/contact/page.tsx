import type { Metadata } from "next";
import {
  MarketingPage,
  MarketingSection,
  MarketingLink,
} from "@/components/marketing/marketing-page";

export const metadata: Metadata = {
  title: "Contact us",
  description: "How to reach the Gida team, and what you can do while the preview is running.",
};

export default function ContactPage() {
  return (
    <MarketingPage
      eyebrow="Support"
      title="Contact us"
      description="Gida is currently a public preview. We have deliberately not published a support address or phone number yet, because there is no team behind it to answer — here is what you can do in the meantime."
    >
      <MarketingSection
        eyebrow="Works today"
        title="Get a real answer through the product itself"
      >
        <div className="max-w-3xl space-y-4 text-muted-foreground">
          <p>
            Both of these are part of the preview now, and they are the same routes the live
            service will use, so starting here means nothing is lost when the service opens.
          </p>
          <ul className="space-y-3">
            <li>
              <span className="font-medium text-foreground">Have a property question or a specific need? </span>
              Post a structured property request and see how matching will work.{" "}
              <MarketingLink href="/requests">Post a property request</MarketingLink>
            </li>
            <li>
              <span className="font-medium text-foreground">Need an agent in a particular area? </span>
              Browse the preview directory, filtered by the areas and specialities they cover.{" "}
              <MarketingLink href="/agents">Find an agent</MarketingLink>
            </li>
            <li>
              <span className="font-medium text-foreground">Not sure how a listing is checked? </span>
              The trust model explains what each status means and what it does not.{" "}
              <MarketingLink href="/trust">Read the trust model</MarketingLink>
            </li>
          </ul>
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="What comes later"
        title="Real contact details, before launch"
      >
        <div className="max-w-3xl space-y-4 text-muted-foreground">
          <p>
            Before the live service opens, this page will carry a support address, a phone line
            and stated response times, plus a dedicated route for reporting a listing that looks
            wrong. Advertiser and listing complaints will get their own process rather than being
            mixed into general support.
          </p>
          <p>
            Until then, anything we published here would be an address nothing listens to. When
            there is somewhere real for your message to land, it will appear on this page first.
          </p>
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Also useful"
        title="Legal and product pages"
      >
        <div className="max-w-3xl space-y-4 text-muted-foreground">
          <p>
            If your question is about what this preview stores or what it may be relied on for,
            these two pages answer most of it.{" "}
            <MarketingLink href="/terms">Terms of service</MarketingLink> and{" "}
            <MarketingLink href="/privacy">Privacy policy</MarketingLink>.
          </p>
          <p>
            For how the marketplace is meant to work day to day, start with{" "}
            <MarketingLink href="/how-it-works">How Gida works</MarketingLink>.
          </p>
        </div>
      </MarketingSection>
    </MarketingPage>
  );
}
