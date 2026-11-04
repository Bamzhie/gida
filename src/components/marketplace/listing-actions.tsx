"use client";

import { useRef, useState } from "react";
import { CalendarDays, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RevealPhone } from "@/components/marketplace/reveal-phone";
import { problemCode } from "@/lib/api-base";
import { isValidContact } from "@/lib/validate";

type ListingActionsProps = {
  propertyId: string;
  propertyTitle: string;
  agentName: string;
  agentPhone?: string;
};

export function ListingActions({ propertyId, propertyTitle, agentName, agentPhone }: ListingActionsProps) {
  const honeypot = useRef("");
  const [submitting, setSubmitting] = useState(false);
  const [enquiryAction, setEnquiryAction] = useState<"contact" | "viewing" | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");

  function openEnquiry(action: "contact" | "viewing") {
    setEnquiryAction(action);
    setConfirmation("");
  }

  function closeEnquiry() {
    setEnquiryAction(null);
    setConfirmation("");
    setMessage("");
  }

  async function submitEnquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enquiryAction === null) return;
    if (!name.trim() || !contact.trim()) {
      toast.error("Add your name and contact before continuing.");
      return;
    }
    if (!isValidContact(contact)) {
      toast.error("Enter a valid email address or phone number.");
      return;
    }
    setSubmitting(true);
    const response = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        listingId: propertyId,
        action: enquiryAction === "viewing" ? "VIEWING" : "CONTACT",
        name: name.trim(),
        contact: contact.trim(),
        message: message.trim() || null,
        website: honeypot.current,
      }),
    });
    setSubmitting(false);
    if (!response.ok) {
      const code = problemCode(await response.json().catch(() => null));
      toast.error(
        code === "duplicate_enquiry" ? "You have already sent this."
        : code === "listing_not_found" ? "This property is no longer available."
        : code === "validation_failed" ? "Check your name and contact details."
        : "The enquiry could not be sent. Try again."
      );
      return;
    }
    setConfirmation("Sent. The advertiser sees it in their dashboard.");
    setName(""); setContact(""); setMessage("");
    toast.success("Enquiry sent to the advertiser.");
  }

  const actionLabel = enquiryAction === "viewing" ? "Book a viewing" : "Request details";

  return (
    <div id="contact-advertiser" className="scroll-mt-24 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <RevealPhone phone={agentPhone} revealLabel="Call advertiser" className="w-full rounded-lg px-2 text-xs sm:text-sm" />
        <Button type="button" variant="outline" onClick={() => openEnquiry("contact")} className="w-full rounded-lg px-2 text-xs sm:text-sm" aria-expanded={enquiryAction === "contact"}>
          <Mail /> Request details
        </Button>
      </div>
      <Button type="button" variant="outline" onClick={() => openEnquiry("viewing")} className="w-full rounded-lg" aria-expanded={enquiryAction === "viewing"}>
        <CalendarDays /> Book a viewing
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        The advertiser sees it in their dashboard.
      </p>
      {enquiryAction !== null && (
        <Card className="border-accent/30 bg-secondary/20">
          <CardContent className="space-y-4 pt-6">
            <div>
              <h3 className="font-semibold">{actionLabel}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Send {agentName} a message about {propertyTitle}. It will appear in their Gida inbox.
              </p>
            </div>
            {confirmation ? (
              <p role="status" className="rounded-xl bg-background p-3 text-sm text-foreground">
                {confirmation}
              </p>
            ) : (
              <form className="space-y-3" onSubmit={submitEnquiry}>
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Your name *</Label>
                  <Input id="contact-name" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-detail">Email or phone *</Label>
                  <Input id="contact-detail" value={contact} onChange={(event) => setContact(event.target.value)} required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={enquiryAction === "viewing" ? "When would you like to view this property?" : "What would you like to ask?"}
                  />
                </div>
                <div className="hidden" aria-hidden="true">
                  <Label htmlFor="enquiry-website">Website</Label>
                  <Input id="enquiry-website" name="website" tabIndex={-1} autoComplete="off"
                         onChange={(event) => { honeypot.current = event.target.value; }} />
                </div>
                <Button type="submit" className="w-full rounded-xl" disabled={submitting}>Send enquiry</Button>
              </form>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={closeEnquiry} className="w-full rounded-xl">
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
