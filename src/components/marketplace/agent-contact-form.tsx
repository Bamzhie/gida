"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isValidContact } from "@/lib/validate";
import { problemCode } from "@/lib/api-base";

type Props = { advertiserId: string; advertiserName: string };

export function AgentContactForm({ advertiserId, advertiserName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const honeypot = useRef("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !contact.trim()) { toast.error("Add your name and contact before continuing."); return; }
    if (!isValidContact(contact)) { toast.error("Enter a valid email address or phone number."); return; }
    setSubmitting(true);
    const response = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        advertiserId,
        action: "CONTACT",
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
        : code === "advertiser_not_found" ? "That advertiser is not listed."
        : "The message could not be sent. Try again."
      );
      return;
    }
    setName(""); setContact(""); setMessage(""); honeypot.current = "";
    setOpen(false);
    toast.success(`Sent to ${advertiserName}.`);
    router.refresh();
  }

  if (!open) {
    return (
      <Button className="w-full rounded-xl" size="sm" onClick={() => setOpen(true)}>
        <MessageCircle className="h-4 w-4" />Contact
      </Button>
    );
  }

  return (
    <Card className="w-full border-accent/30 bg-secondary/20">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Message {advertiserName}</h3>
            <p className="mt-1 text-sm text-muted-foreground">They see it in their dashboard.</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close contact form" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor={`agent-name-${advertiserId}`}>Your name *</Label>
            <Input id={`agent-name-${advertiserId}`} required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`agent-contact-${advertiserId}`}>Email or phone *</Label>
            <Input id={`agent-contact-${advertiserId}`} required autoComplete="email" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`agent-message-${advertiserId}`}>Message</Label>
            <Textarea id={`agent-message-${advertiserId}`} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What would you like to ask?" />
          </div>
          <div className="hidden" aria-hidden="true">
            <Label htmlFor={`agent-website-${advertiserId}`}>Website</Label>
            <Input id={`agent-website-${advertiserId}`} name="website" tabIndex={-1} autoComplete="off" onChange={(e) => { honeypot.current = e.target.value; }} />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={submitting}><Mail className="h-4 w-4" />Send message</Button>
        </form>
      </CardContent>
    </Card>
  );
}
