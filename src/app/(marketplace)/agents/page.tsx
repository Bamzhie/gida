"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, BadgeCheck, MessageCircle, Building2, Clock3, X, Mail } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { searchPreviewAgents } from "@/lib/preview-agents";
import { savePreviewAgentEnquiry, validatePreviewContact } from "@/lib/preview-storage";

export default function AgentsPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactDetail, setContactDetail] = useState("");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const agents = useMemo(() => searchPreviewAgents(submittedQuery), [submittedQuery]);
  const selectedAgent = agents.find((agent) => agent.id === selectedId);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSelectedId(null);
      setContactOpen(false);
      setConfirmation("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [submittedQuery]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSelectedId(null);
    setContactOpen(false);
    setSubmittedQuery(query);
  }

  function openContact(agentId: string) {
    setSelectedId(agentId);
    setContactOpen(true);
    setConfirmation("");
  }

  function closeContact() {
    setContactOpen(false);
    setConfirmation("");
    setMessage("");
  }

  function submitContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAgent) return;
    if (!contactName.trim() || !contactDetail.trim()) {
      toast.error("Add your name and contact before continuing.");
      return;
    }
    if (!validatePreviewContact(contactDetail)) {
      toast.error("Enter a valid email address or phone number.");
      return;
    }
    savePreviewAgentEnquiry({
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      name: contactName.trim(),
      contact: contactDetail.trim(),
      message: message.trim(),
    });
    setConfirmation("Saved in this browser preview. No message has been sent.");
    setContactName("");
    setContactDetail("");
    setMessage("");
    toast.success("Agent enquiry preview saved locally.");
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 max-w-2xl">
        <Badge variant="secondary" className="mb-4 gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Sample agent profiles
        </Badge>
        <h1 className="mb-2 font-heading text-3xl font-bold">Find agents</h1>
        <p className="text-muted-foreground">
          Browse illustrative agent and agency profiles by the areas they serve and the properties
          they handle. Verification badges and response times are preview data.
        </p>
      </div>

      <form className="mb-8 flex max-w-2xl flex-col gap-3 sm:flex-row" onSubmit={submitSearch}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="agent-search"
            aria-label="Search agents"
            placeholder="Search by name, agency or area..."
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Button className="rounded-xl" type="submit">Search agents</Button>
      </form>

      {selectedAgent && (
        <Card className="mb-6 border-primary/30 bg-secondary/20">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl font-semibold">{selectedAgent.name}</h2>
                {selectedAgent.verified && <BadgeCheck className="h-5 w-5 text-accent" aria-label="Preview verification example" />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{selectedAgent.agency}</p>
              <p className="mt-3 max-w-2xl text-sm">{selectedAgent.bio}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedAgent.specialisations.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
              </div>
            </div>
            <Button variant="ghost" size="icon" aria-label="Close agent profile" onClick={() => setSelectedId(null)}>
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedAgent && contactOpen && (
        <Card className="mb-6 border-accent/30 bg-secondary/20">
          <CardContent className="space-y-4 pt-6">
            <div>
              <h2 className="font-semibold">Contact {selectedAgent.name} preview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use synthetic contact details. This preview does not contact or notify the agent.
              </p>
            </div>
            {confirmation ? (
              <p role="status" className="rounded-xl bg-background p-3 text-sm text-foreground">{confirmation}</p>
            ) : (
              <form className="space-y-3" onSubmit={submitContact}>
                <div className="space-y-2">
                  <Label htmlFor="agent-contact-name">Your name *</Label>
                  <Input id="agent-contact-name" required value={contactName} onChange={(event) => setContactName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-contact-detail">Email or phone *</Label>
                  <Input id="agent-contact-detail" required value={contactDetail} onChange={(event) => setContactDetail(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-contact-message">Message</Label>
                  <Textarea id="agent-contact-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What would you like to ask?" />
                </div>
                <Button type="submit" className="w-full rounded-xl"><Mail className="h-4 w-4" />Save agent enquiry preview</Button>
              </form>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={closeContact} className="w-full rounded-xl">Close preview</Button>
          </CardContent>
        </Card>
      )}

      {agents.length === 0 ? (
        <Card className="mx-auto max-w-lg text-center">
          <CardContent className="pt-10 pb-10">
            <Search className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
            <h2 className="font-semibold">No agents match that search</h2>
            <p className="mt-2 text-sm text-muted-foreground">Try a different name, agency or Lagos area.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="rounded-2xl">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{agent.initials}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate font-heading font-semibold">{agent.name}</h3>
                      {agent.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-accent" aria-label="Preview verification example" />}
                    </div>
                    <p className="flex items-center gap-1 truncate text-sm text-muted-foreground"><Building2 className="h-3 w-3" />{agent.agency}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="mb-1.5 text-xs text-muted-foreground">Areas served</p>
                  <div className="flex flex-wrap gap-1.5">{agent.areas.map((area) => <Badge key={area} variant="outline" className="text-xs font-normal"><MapPin className="h-3 w-3" />{area}</Badge>)}</div>
                </div>
                <div className="mb-4">
                  <p className="mb-1.5 text-xs text-muted-foreground">Specialisations</p>
                  <div className="flex flex-wrap gap-1.5">{agent.specialisations.map((spec) => <Badge key={spec} variant="secondary" className="text-xs font-normal">{spec}</Badge>)}</div>
                </div>
                <div className="mb-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />{agent.responseTime}</span>
                  <span>{agent.listings} sample listings</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl" size="sm" onClick={() => setSelectedId(agent.id)}>View profile</Button>
                  <Button className="flex-1 rounded-xl" size="sm" onClick={() => openContact(agent.id)}><MessageCircle className="h-4 w-4" />Contact preview</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">Profiles and contact flows are illustrative in this preview; no agent receives a message.</p>
    </div>
  );
}
