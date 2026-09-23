"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AREAS = [
  "Lekki",
  "Victoria Island",
  "Ikoyi",
  "Ikeja",
  "Yaba",
  "Surulere",
  "Ajah",
  "Magodo",
  "Gbagada",
];

const PROPERTY_TYPES = [
  { value: "", label: "Any type" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "CONDO", label: "Condo" },
  { value: "LAND", label: "Land" },
  { value: "COMMERCIAL", label: "Commercial" },
];

const BEDROOMS = [
  { value: "", label: "Any beds" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

const BUDGETS = [
  { label: "Any price", min: undefined, max: undefined },
  { label: "Under 2 million", min: undefined, max: 2_000_000 },
  { label: "2 to 5 million", min: 2_000_000, max: 5_000_000 },
  { label: "5 to 15 million", min: 5_000_000, max: 15_000_000 },
  { label: "Above 15 million", min: 15_000_000, max: undefined },
];

const fieldClass =
  "w-full bg-transparent text-sm font-medium text-foreground focus-visible:outline-none cursor-pointer";

export function HeroSearch() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [listingType, setListingType] = useState("RENT");
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [budgetIdx, setBudgetIdx] = useState(0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (listingType) params.set("listingType", listingType);
    if (propertyType) params.set("propertyType", propertyType);
    if (bedrooms) params.set("bedrooms", bedrooms);
    const budget = BUDGETS[budgetIdx];
    if (budget.min) params.set("minPrice", String(budget.min));
    if (budget.max) params.set("maxPrice", String(budget.max));
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-card border border-border shadow-[0_20px_50px_-20px_rgba(21,20,15,0.35)] p-5 sm:p-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto] gap-4 sm:gap-0 sm:divide-x sm:divide-border items-center">
          <div className="sm:px-5 sm:py-4">
            <label className="block text-xs text-muted-foreground mb-1">Location</label>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                list="lagos-areas"
                placeholder="Lekki, Ikeja, Yaba..."
                className={fieldClass}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <datalist id="lagos-areas">
                {AREAS.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="sm:px-5 sm:py-4">
            <label className="block text-xs text-muted-foreground mb-1">Property type</label>
            <select className={fieldClass} value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value || "any"} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:px-5 sm:py-4">
            <label className="block text-xs text-muted-foreground mb-1">Bedrooms</label>
            <select className={fieldClass} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
              {BEDROOMS.map((b) => (
                <option key={b.value || "any"} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:px-5 sm:py-4">
            <label className="block text-xs text-muted-foreground mb-1">Looking to</label>
            <select className={fieldClass} value={listingType} onChange={(e) => setListingType(e.target.value)}>
              <option value="RENT">Rent</option>
              <option value="SALE">Buy</option>
            </select>
          </div>

          <div className="sm:px-5 sm:py-4">
            <label className="block text-xs text-muted-foreground mb-1">Price range</label>
            <select className={fieldClass} value={budgetIdx} onChange={(e) => setBudgetIdx(Number(e.target.value))}>
              {BUDGETS.map((b, i) => (
                <option key={b.label} value={i}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" size="lg" className="rounded-xl w-full sm:w-auto h-14 sm:ml-2">
            <Search className="h-4 w-4" />
            Search homes
          </Button>
        </div>
      </form>

      <p className="mt-3 flex items-center justify-center gap-2 text-sm text-white/85">
        <MapPinned className="h-4 w-4" />
        <Link href="/listings" className="font-medium underline underline-offset-4 hover:text-white">
          Explore nearby on the map
        </Link>
      </p>
    </div>
  );
}