"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, MapPinned, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AREAS = ["Lekki", "Victoria Island", "Ikoyi", "Ikeja", "Yaba", "Surulere", "Ajah", "Magodo", "Gbagada"];
const PROPERTY_TYPES = [
  { value: "", label: "Any type" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "CONDO", label: "Condo" },
  { value: "LAND", label: "Land" },
  { value: "COMMERCIAL", label: "Commercial" },
];
const BEDROOMS = ["", "1", "2", "3", "4", "5"];
const RENT_BUDGETS = [
  { label: "Any price", min: undefined, max: undefined },
  { label: "Under 1 million", min: undefined, max: 1_000_000 },
  { label: "1 to 2.5 million", min: 1_000_000, max: 2_500_000 },
  { label: "2.5 to 5 million", min: 2_500_000, max: 5_000_000 },
  { label: "Above 5 million", min: 5_000_000, max: undefined },
];
const SALE_BUDGETS = [
  { label: "Any price", min: undefined, max: undefined },
  { label: "Under 50 million", min: undefined, max: 50_000_000 },
  { label: "50 to 100 million", min: 50_000_000, max: 100_000_000 },
  { label: "100 to 250 million", min: 100_000_000, max: 250_000_000 },
  { label: "Above 250 million", min: 250_000_000, max: undefined },
];
const fieldClass = "w-full bg-transparent text-sm font-medium text-foreground focus-visible:outline-none";

export function HeroSearch() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [listingType, setListingType] = useState("RENT");
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [budgetIdx, setBudgetIdx] = useState(0);

  const budgets = listingType === "SALE" ? SALE_BUDGETS : RENT_BUDGETS;
  const budget = budgets[Math.min(budgetIdx, budgets.length - 1)];

  function handleListingTypeChange(value: string) {
    setListingType(value);
    setBudgetIdx(0);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (listingType === "SHORTLET") {
      params.set("listingType", "RENT");
      params.set("category", "SHORTLET");
    } else if (listingType) {
      params.set("listingType", listingType);
    }
    if (propertyType) params.set("propertyType", propertyType);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (budget.min !== undefined) params.set("minPrice", String(budget.min));
    if (budget.max !== undefined) params.set("maxPrice", String(budget.max));
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="rounded-2xl bg-card border border-border shadow-[0_20px_50px_-20px_rgba(21,20,15,0.35)] p-5 sm:p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1.1fr_0.9fr_0.9fr_0.9fr_0.9fr_auto] gap-4 sm:gap-0 sm:divide-x sm:divide-border items-center">
          <div className="sm:px-4 sm:py-4">
            <label htmlFor="hero-location" className="block text-xs text-muted-foreground mb-1">Location</label>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <input id="hero-location" list="lagos-areas" placeholder="Lekki, Ikeja, Yaba..." className={fieldClass} value={city} onChange={(event) => setCity(event.target.value)} />
              <datalist id="lagos-areas">{AREAS.map((area) => <option key={area} value={area} />)}</datalist>
            </div>
          </div>
          <div className="sm:px-4 sm:py-4">
            <label htmlFor="hero-keyword" className="block text-xs text-muted-foreground mb-1">Keyword</label>
            <input id="hero-keyword" type="text" placeholder="2 bedroom, serviced..." className={cn(fieldClass, "cursor-text")} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          </div>
          <div className="sm:px-4 sm:py-4">
            <label htmlFor="hero-property-type" className="block text-xs text-muted-foreground mb-1">Property type</label>
            <select id="hero-property-type" className={fieldClass} value={propertyType} onChange={(event) => setPropertyType(event.target.value)}>{PROPERTY_TYPES.map((type) => <option key={type.value || "any"} value={type.value}>{type.label}</option>)}</select>
          </div>
          <div className="sm:px-4 sm:py-4">
            <label htmlFor="hero-bedrooms" className="block text-xs text-muted-foreground mb-1">Bedrooms</label>
            <select id="hero-bedrooms" className={fieldClass} value={bedrooms} onChange={(event) => setBedrooms(event.target.value)}>{BEDROOMS.map((value) => <option key={value || "any"} value={value}>{value ? `${value}+` : "Any beds"}</option>)}</select>
          </div>
          <div className="sm:px-4 sm:py-4">
            <label htmlFor="hero-listing-type" className="block text-xs text-muted-foreground mb-1">Looking to</label>
            <select id="hero-listing-type" className={fieldClass} value={listingType} onChange={(event) => handleListingTypeChange(event.target.value)}>
              <option value="RENT">Rent</option>
              <option value="SALE">Buy</option>
              <option value="SHORTLET">Short-let</option>
            </select>
          </div>
          <div className="sm:px-4 sm:py-4">
            <label htmlFor="hero-price" className="block text-xs text-muted-foreground mb-1">Price range</label>
            <select id="hero-price" className={fieldClass} value={budgetIdx} onChange={(event) => setBudgetIdx(Number(event.target.value))}>{budgets.map((band, index) => <option key={band.label} value={index}>{band.label}</option>)}</select>
          </div>
          <Button type="submit" size="lg" className="rounded-xl w-full sm:w-auto h-14 sm:ml-2"><Search className="h-4 w-4" />Search homes</Button>
        </div>
      </form>
      <p className="mt-3 flex items-center justify-center gap-2 text-sm text-white/85">
        <MapPinned className="h-4 w-4" />
        <Link href="/map" className="font-medium underline underline-offset-4 hover:text-white">Explore nearby on the map</Link>
      </p>
    </div>
  );
}
