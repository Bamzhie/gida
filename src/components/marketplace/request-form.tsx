"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FURNISHING_OPTIONS, PROPERTY_TYPE_OPTIONS } from "@/lib/vocabulary";
import { isValidBudgetRange, isValidContact } from "@/lib/validate";
import { problemCode } from "@/lib/api-base";
import type { AmenityDto, LocationDto } from "@/lib/api-types";

type Props = { areas: LocationDto[]; amenities: AmenityDto[] };

/** Places a location in the hierarchy so a flat list still reads as Lekki under Eti-Osa under Lagos. */
function pathOf(location: LocationDto, byId: Map<string, LocationDto>): string {
  const parts = [location.name];
  let parent = location.parentSlug ? byId.get(location.parentSlug) : undefined;
  while (parent) {
    parts.unshift(parent.name);
    parent = parent.parentSlug ? byId.get(parent.parentSlug) : undefined;
  }
  return parts.join(" / ");
}

export function RequestForm({ areas, amenities }: Props) {
  const router = useRouter();
  const byId = new Map(areas.map((area) => [area.slug, area]));
  const pickable = areas
    .filter((area) => ["LGA", "AREA", "ESTATE"].includes(area.kind))
    .map((area) => ({ slug: area.slug, label: pathOf(area, byId) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const [title, setTitle] = useState("");
  const [listingType, setListingType] = useState<"RENT" | "SALE">("RENT");
  const [propertyType, setPropertyType] = useState("");
  const [location, setLocation] = useState<string>("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [furnishing, setFurnishing] = useState("any");
  const [neededBy, setNeededBy] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const honeypot = useRef("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmation("");
    if (!title.trim() || !name.trim() || !contact.trim()) {
      toast.error("Fill in the title, your name and how to reach you.");
      return;
    }
    if (!isValidContact(contact)) { toast.error("Enter a valid email address or phone number."); return; }
    if (!isValidBudgetRange(minBudget, maxBudget)) {
      toast.error("Your maximum budget must be greater than or equal to your minimum budget.");
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        listingType,
        propertyType,
        location,
        minPrice: minBudget === "" ? null : Number(minBudget),
        maxPrice: maxBudget === "" ? null : Number(maxBudget),
        bedrooms: bedrooms === "" ? null : Number(bedrooms),
        bathrooms: bathrooms === "" ? null : Number(bathrooms),
        furnished: furnishing === "any" ? null : furnishing === "true",
        neededBy: neededBy === "" ? null : neededBy,
        notes: notes.trim() || null,
        name: name.trim(),
        contact: contact.trim(),
        amenities: selected,
        website: honeypot.current,
      }),
    });
    setSubmitting(false);

    if (!response.ok) {
      const code = problemCode(await response.json().catch(() => null));
      toast.error(
        code === "duplicate_request" ? "You have already posted this request."
        : code === "unknown_location" ? "Choose an area from the list."
        : code === "invalid_budget" ? "Check the budget range."
        : code === "validation_failed" ? "Check the highlighted fields."
        : "The request could not be posted. Try again."
      );
      return;
    }
    const created = (await response.json()) as { id: string };
    setConfirmation(`Request ${created.id.slice(0, 8)} is open. Advertisers with matching listings can see it now.`);
    setTitle(""); setLocation(""); setMinBudget(""); setMaxBudget(""); setBedrooms("");
    setBathrooms(""); setNeededBy(""); setNotes(""); setName(""); setContact(""); setSelected([]);
    honeypot.current = "";
    toast.success("Request posted.");
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      {confirmation && (
        <p role="status" className="mb-6 rounded-xl border border-accent/30 bg-secondary/30 p-4 text-sm">
          {confirmation}
        </p>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What are you looking for?</CardTitle>
          <CardDescription>
            Structured fields help the right advertisers find you — not just a free-text post.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Request title *</Label>
            <Input id="title" placeholder="e.g. 2-bedroom flat for rent" value={title} maxLength={160}
                   onChange={(event) => setTitle(event.target.value)} required />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="listing-type">Looking to</Label>
              <Select value={listingType} onValueChange={(value) => setListingType(value as "RENT" | "SALE")}>
                <SelectTrigger id="listing-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RENT">Rent</SelectItem>
                  <SelectItem value="SALE">Buy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="property-type">Property type</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger id="property-type"><SelectValue placeholder="Any type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any type</SelectItem>
                  {PROPERTY_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Preferred location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="location"><SelectValue placeholder="Anywhere" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Anywhere</SelectItem>
                {pickable.map((area) => (
                  <SelectItem key={area.slug} value={area.slug}>{area.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Anywhere reaches every advertiser whose live listing fits the rest of this form.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="minBudget">Min budget (₦)</Label>
              <Input id="minBudget" type="number" min={0} placeholder="0" value={minBudget}
                     onChange={(event) => setMinBudget(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxBudget">Max budget (₦)</Label>
              <Input id="maxBudget" type="number" min={0} placeholder="5,000,000" value={maxBudget}
                     onChange={(event) => setMaxBudget(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neededBy">Needed by</Label>
              <Input id="neededBy" type="month" value={neededBy}
                     onChange={(event) => setNeededBy(event.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input id="bedrooms" type="number" min={0} max={32767} placeholder="2" value={bedrooms}
                     onChange={(event) => setBedrooms(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input id="bathrooms" type="number" min={0} max={32767} placeholder="2" value={bathrooms}
                     onChange={(event) => setBathrooms(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="furnishing">Furnishing</Label>
              <Select value={furnishing} onValueChange={setFurnishing}>
                <SelectTrigger id="furnishing"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FURNISHING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2" role="group" aria-labelledby="required-amenities-label">
            <Label id="required-amenities-label">Required amenities</Label>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <button
                  key={amenity.slug}
                  type="button"
                  aria-pressed={selected.includes(amenity.slug)}
                  onClick={() => setSelected((previous) => previous.includes(amenity.slug)
                    ? previous.filter((slug) => slug !== amenity.slug)
                    : [...previous, amenity.slug])}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected.includes(amenity.slug)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  {amenity.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional requirements</Label>
            <Textarea id="notes" placeholder="Anything else the advertiser should know..." value={notes}
                      maxLength={5000} onChange={(event) => setNotes(event.target.value)} />
          </div>

          <div className="hidden" aria-hidden="true">
            <Label htmlFor="request-website">Website</Label>
            <Input id="request-website" name="website" tabIndex={-1} autoComplete="off"
                   onChange={(event) => { honeypot.current = event.target.value; }} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>How can advertisers reach you?</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Your name *</Label>
              <Input id="name" placeholder="e.g. Chinedu O." value={name} autoComplete="name" maxLength={120}
                     onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Email or phone *</Label>
              <Input id="contact" placeholder="you@example.com or 080..." value={contact} autoComplete="email"
                     maxLength={320} onChange={(event) => setContact(event.target.value)} required />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Advertisers with a matching live listing see this request and can contact you directly.
          </p>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" disabled={submitting} className="w-full rounded-xl sm:w-auto">
        <Send className="h-4 w-4" />{submitting ? "Posting…" : "Post request"}
      </Button>
    </form>
  );
}
