"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { clearPreviewData, savePreviewRequest, validateBudgetRange, validatePreviewContact } from "@/lib/preview-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "CONDO", label: "Condo" },
  { value: "LAND", label: "Land" },
  { value: "COMMERCIAL", label: "Commercial" },
];
const FURNISHING = [
  { value: "UNFURNISHED", label: "Unfurnished" },
  { value: "FURNISHED", label: "Furnished" },
  { value: "SERVICED", label: "Serviced" },
];
const AMENITIES = ["Parking", "Security", "Generator", "Borehole / water supply", "Estate / gated community", "Serviced", "Pool", "Gym"];

export default function RequestsPage() {
  const [title, setTitle] = useState("");
  const [listingType, setListingType] = useState<"RENT" | "SALE">("RENT");
  const [propertyType, setPropertyType] = useState("APARTMENT");
  const [location, setLocation] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [furnishing, setFurnishing] = useState("UNFURNISHED");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [availability, setAvailability] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [confirmation, setConfirmation] = useState("");

  function toggleAmenity(a: string) { setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]); }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setConfirmation("");
    if (!title.trim() || !location.trim() || !name.trim() || !contact.trim()) { toast.error("Please fill in the request title, location, your name and contact."); return; }
    if (!validatePreviewContact(contact)) { toast.error("Enter a valid email address or phone number."); return; }
    if (!validateBudgetRange(minBudget, maxBudget)) { toast.error("Your maximum budget must be greater than or equal to your minimum budget."); return; }
    const saved = savePreviewRequest({ title: title.trim(), listingType, propertyType, location: location.trim(), minBudget, maxBudget, bedrooms, bathrooms, furnishing, amenities, availability, notes, name: name.trim(), contact: contact.trim() });
    setConfirmation(`Request ${saved.id} saved in this browser preview. No advertiser has received it.`);
    toast.success("Request saved locally. No advertiser has received it.");
    setTitle(""); setLocation(""); setMinBudget(""); setMaxBudget(""); setBedrooms(""); setBathrooms(""); setAvailability(""); setNotes(""); setName(""); setContact(""); setAmenities([]);
  }

  function clearSavedData() {
    clearPreviewData();
    setConfirmation("All preview data was cleared from this browser.");
    toast.success("Preview data cleared.");
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl"><div className="mb-8"><Badge variant="secondary" className="mb-4 gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Property requests</Badge><h1 className="font-heading text-3xl font-bold mb-2">Post a property request</h1><p className="text-muted-foreground">Tell agents and landlords what you are looking for. In this preview, your request is saved only in this browser and no advertiser receives it.</p></div>{confirmation && <p role="status" className="mb-6 rounded-xl border border-accent/30 bg-secondary/30 p-4 text-sm">{confirmation}</p>}<form onSubmit={handleSubmit}><Card className="mb-6"><CardHeader><CardTitle>What are you looking for?</CardTitle><CardDescription>Structured fields help the right advertisers find you — not just a free-text post.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="title">Request title *</Label><Input id="title" placeholder="e.g. 2-bedroom flat for rent" value={title} onChange={(e) => setTitle(e.target.value)} required /></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="listing-type">Looking to</Label><Select value={listingType} onValueChange={(value) => setListingType(value as "RENT" | "SALE")}><SelectTrigger id="listing-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="RENT">Rent</SelectItem><SelectItem value="SALE">Buy</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="property-type">Property type</Label><Select value={propertyType} onValueChange={setPropertyType}><SelectTrigger id="property-type"><SelectValue /></SelectTrigger><SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-2"><Label htmlFor="location">Preferred location *</Label><Input id="location" placeholder="e.g. Lekki, Ikeja, Yaba..." value={location} onChange={(e) => setLocation(e.target.value)} required /></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div className="space-y-2"><Label htmlFor="minBudget">Min budget (₦)</Label><Input id="minBudget" type="number" min={0} placeholder="0" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="maxBudget">Max budget (₦)</Label><Input id="maxBudget" type="number" min={0} placeholder="5,000,000" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="availability">Needed by</Label><Input id="availability" type="month" value={availability} onChange={(e) => setAvailability(e.target.value)} /></div></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div className="space-y-2"><Label htmlFor="bedrooms">Bedrooms</Label><Input id="bedrooms" type="number" min={0} placeholder="2" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="bathrooms">Bathrooms</Label><Input id="bathrooms" type="number" min={0} placeholder="2" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="furnishing">Furnishing</Label><Select value={furnishing} onValueChange={setFurnishing}><SelectTrigger id="furnishing"><SelectValue /></SelectTrigger><SelectContent>{FURNISHING.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-2" role="group" aria-labelledby="required-amenities-label"><Label id="required-amenities-label">Required amenities</Label><div className="flex flex-wrap gap-2">{AMENITIES.map((a) => <button key={a} type="button" aria-pressed={amenities.includes(a)} onClick={() => toggleAmenity(a)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${amenities.includes(a) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}>{a}</button>)}</div></div><div className="space-y-2"><Label htmlFor="notes">Additional requirements</Label><Textarea id="notes" placeholder="Anything else the advertiser should know..." value={notes} onChange={(e) => setNotes(e.target.value)} /></div></CardContent></Card><Card className="mb-6"><CardHeader><CardTitle>How can advertisers reach you?</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="name">Your name *</Label><Input id="name" placeholder="e.g. Chinedu O." value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></div><div className="space-y-2"><Label htmlFor="contact">Email or phone *</Label><Input id="contact" placeholder="you@example.com or 080..." value={contact} onChange={(e) => setContact(e.target.value)} required autoComplete="email" /></div></div>Use synthetic contact details in this preview. Nothing is sent to an advertiser.</CardContent></Card><div className="flex flex-wrap items-center gap-3"><Button type="submit" size="lg" className="rounded-xl w-full sm:w-auto"><Send className="h-4 w-4" />Save request preview</Button><Button type="button" variant="outline" className="rounded-xl" onClick={clearSavedData}>Clear all preview data</Button></div></form></div>
  );
}
