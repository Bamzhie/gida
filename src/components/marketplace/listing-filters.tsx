"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LocationDto } from "@/lib/api-types";
import { listingQueryToSearchParams, type ListingQuery } from "@/lib/listing-params";

type FilterDraft = {
  q: string;
  location: string;
  listingType: string;
  category: string;
  availability: string;
  propertyType: string;
  bedrooms: string;
  minPrice: string;
  maxPrice: string;
};

function draftFromQuery(query: ListingQuery): FilterDraft {
  return {
    q: query.q ?? "",
    location: query.location ?? "all",
    listingType: query.listingType ?? "all",
    category: query.category ?? "all",
    availability: query.availability ?? "all",
    propertyType: query.propertyType ?? "all",
    bedrooms: query.bedrooms ? String(query.bedrooms) : "all",
    minPrice: query.minPrice ? String(query.minPrice) : "",
    maxPrice: query.maxPrice ? String(query.maxPrice) : "",
  };
}

export function ListingFilters({
  query,
  locations,
}: {
  query: ListingQuery;
  locations: LocationDto[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [draft, setDraft] = useState(() => draftFromQuery(query));
  const [open, setOpen] = useState(false);

  const areaOptions = locations.filter(
    (location) => location.kind === "AREA" || location.kind === "ESTATE"
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: ListingQuery = {
      q: draft.q.trim() || undefined,
      location: draft.location === "all" ? undefined : draft.location,
      listingType: draft.listingType === "all" ? undefined : (draft.listingType as ListingQuery["listingType"]),
      category: draft.category === "all" ? undefined : (draft.category as ListingQuery["category"]),
      availability: draft.availability === "all" ? undefined : (draft.availability as ListingQuery["availability"]),
      propertyType: draft.propertyType === "all" ? undefined : (draft.propertyType as ListingQuery["propertyType"]),
      bedrooms: draft.bedrooms === "all" ? undefined : Number(draft.bedrooms),
      minPrice: draft.minPrice ? Number(draft.minPrice) : undefined,
      maxPrice: draft.maxPrice ? Number(draft.maxPrice) : undefined,
      sort: query.sort,
    };
    if (next.listingType === "SALE" && next.category === "SHORTLET") next.category = undefined;

    const suffix = listingQueryToSearchParams(next).toString();
    router.push(suffix ? `${pathname}?${suffix}` : pathname);
  }

  const fields = (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="filter-location">Location</Label>
        <Select value={draft.location} onValueChange={(location) => setDraft({ ...draft, location })}>
          <SelectTrigger id="filter-location" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any area</SelectItem>
            {areaOptions.map((area) => (
              <SelectItem key={area.slug} value={area.slug}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-keyword">Keyword</Label>
        <Input
          id="filter-keyword"
          autoComplete="off"
          placeholder="e.g. furnished, garden"
          value={draft.q}
          onChange={(event) => setDraft({ ...draft, q: event.target.value })}
        />
      </div>
      <FilterSelect
        label="Listing type"
        value={draft.listingType}
        onValueChange={(listingType) => setDraft({ ...draft, listingType })}
        options={[["all", "Buy or rent"], ["SALE", "For sale"], ["RENT", "For rent"]]}
      />
      <FilterSelect
        label="Availability"
        value={draft.availability}
        onValueChange={(availability) => setDraft({ ...draft, availability })}
        options={[
          ["all", "Any status"],
          ["AVAILABLE", "Available"],
          ["PENDING", "Pending"],
          ["SOLD", "Sold"],
          ["RENTED", "Rented"],
        ]}
      />
      <FilterSelect
        label="Property type"
        value={draft.propertyType}
        onValueChange={(propertyType) => setDraft({ ...draft, propertyType })}
        options={[
          ["all", "Any type"],
          ["APARTMENT", "Apartment / flat"],
          ["HOUSE", "House"],
          ["TOWNHOUSE", "Townhouse"],
          ["CONDO", "Condo"],
          ["LAND", "Land"],
          ["COMMERCIAL", "Commercial"],
        ]}
      />
      <FilterSelect
        label="Category"
        value={draft.category}
        onValueChange={(category) => setDraft({ ...draft, category })}
        options={[
          ["all", "All categories"],
          ["STANDARD", "Standard"],
          ["SHORTLET", "Short-let"],
          ["NEW_HOMES", "New homes"],
        ]}
      />
      <FilterSelect
        label="Bedrooms"
        value={draft.bedrooms}
        onValueChange={(bedrooms) => setDraft({ ...draft, bedrooms })}
        options={[
          ["all", "Any bedrooms"],
          ["1", "1+ bedrooms"],
          ["2", "2+ bedrooms"],
          ["3", "3+ bedrooms"],
          ["4", "4+ bedrooms"],
          ["5", "5+ bedrooms"],
        ]}
      />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium leading-none">Price range (₦)</legend>
        <div className="grid grid-cols-2 gap-2">
          <Input
            aria-label="Minimum price"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Min"
            value={draft.minPrice}
            onChange={(event) => setDraft({ ...draft, minPrice: event.target.value })}
          />
          <Input
            aria-label="Maximum price"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Max"
            value={draft.maxPrice}
            onChange={(event) => setDraft({ ...draft, maxPrice: event.target.value })}
          />
        </div>
      </fieldset>
      <Button type="submit" className="w-full">Apply filters</Button>
    </form>
  );

  return (
    <aside className="self-start rounded-2xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-24 lg:p-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="listing-filter-fields"
        className="flex w-full items-center justify-between font-heading text-lg font-semibold lg:cursor-default"
      >
        <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Filters</span>
        <ChevronDown className={`h-4 w-4 transition-transform lg:hidden ${open ? "rotate-180" : ""}`} />
      </button>
      <div id="listing-filter-fields" className={`${open ? "block" : "hidden"} mt-5 lg:block`}>
        {fields}
      </div>
    </aside>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: [string, string][];
}) {
  const id = `filter-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map(([option, text]) => <SelectItem key={option} value={option}>{text}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
