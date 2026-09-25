"use client";

import { useEffect, useState } from "react";
import { Heart, Mail, Phone, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { getFavoriteIds, saveFavorite, savePreviewEnquiry, validatePreviewContact } from "@/lib/preview-storage";

type ListingActionsProps = {
  propertyId: string;
  propertyTitle: string;
  agentName: string;
  agentPhone?: string;
};

export function ListingActions({ propertyId, propertyTitle, agentName, agentPhone }: ListingActionsProps) {
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [enquiryAction, setEnquiryAction] = useState<"contact" | "viewing" | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSaved(getFavoriteIds().includes(propertyId));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [propertyId]);

  function toggleFavorite() {
    const next = saveFavorite(propertyId);
    const isSaved = next.includes(propertyId);
    setSaved(isSaved);
    toast.success(isSaved ? "Property saved in this browser preview." : "Removed from saved properties.");
  }

  async function shareProperty() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: propertyTitle, url });
      } catch {
        // A cancelled native share is not an application error.
      }
      return;
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Listing link copied.");
      } catch {
        toast.error("The listing link could not be copied.");
      }
      return;
    }
    toast.error("Sharing is not available in this browser.");
  }

  function openEnquiry(action: "contact" | "viewing") {
    setEnquiryAction(action);
    setConfirmation("");
  }

  function closeEnquiry() {
    setEnquiryAction(null);
    setConfirmation("");
    setMessage("");
  }

  function submitPreviewMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !contact.trim()) {
      toast.error("Add your name and contact before continuing.");
      return;
    }
    if (!validatePreviewContact(contact)) {
      toast.error("Enter a valid email address or phone number.");
      return;
    }
    if (enquiryAction === null) return;
    savePreviewEnquiry({
      propertyId,
      propertyTitle,
      action: enquiryAction,
      name: name.trim(),
      contact: contact.trim(),
      message: message.trim(),
    });
    setConfirmation("Saved in this browser preview. No message has been sent.");
    setName("");
    setContact("");
    setMessage("");
    toast.success("Preview enquiry saved locally.");
  }

  const actionLabel = enquiryAction === "viewing" ? "Request a viewing" : "Contact advertiser";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={saved ? "secondary" : "default"}
          onClick={toggleFavorite}
          aria-pressed={saved}
          className="flex-1 rounded-xl"
        >
          <Heart className={saved ? "fill-accent text-accent" : ""} />
          {hydrated && saved ? "Saved" : "Save property"}
        </Button>
        <Button type="button" variant="outline" onClick={shareProperty} className="flex-1 rounded-xl">
          <Share2 /> Share
        </Button>
      </div>
      {agentPhone && (
        <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <Phone className="h-4 w-4" /> Demo advertiser number: {agentPhone}
        </p>
      )}
      <Button type="button" onClick={() => openEnquiry("contact")} className="w-full rounded-xl" aria-expanded={enquiryAction === "contact"}>
        <Mail /> Contact advertiser
      </Button>
      <Button type="button" variant="outline" onClick={() => openEnquiry("viewing")} className="w-full rounded-xl" aria-expanded={enquiryAction === "viewing"}>
        Request a viewing
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Preview only — this does not contact or notify the advertiser. Use synthetic contact details.
      </p>
      {enquiryAction !== null && (
        <Card className="border-accent/30 bg-secondary/20">
          <CardContent className="space-y-4 pt-6">
            <div>
              <h3 className="font-semibold">{actionLabel} preview</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Compose a local preview for {agentName} about {propertyTitle}. Nothing is sent.
              </p>
            </div>
            {confirmation ? (
              <p role="status" className="rounded-xl bg-background p-3 text-sm text-foreground">
                {confirmation}
              </p>
            ) : (
              <form className="space-y-3" onSubmit={submitPreviewMessage}>
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
                <Button type="submit" className="w-full rounded-xl">Save preview enquiry</Button>
              </form>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={closeEnquiry} className="w-full rounded-xl">
              Close preview
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
