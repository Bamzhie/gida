"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  filterPreviewProperties,
  listingQueryToSearchParams,
  parseListingQuery,
  type ListingQuery,
} from "@/lib/preview-listings";
import { PREVIEW_PROPERTIES } from "@/lib/preview-data";
import { getFavoriteIds, saveFavorite } from "@/lib/preview-storage";
import { ListingCard } from "@/components/marketplace/listing-card";

type FilterDraft = {
  city: string;
  keyword: string;
  listingType: string;
  category: string;
  status: string;
  propertyType: string;
  bedrooms: string;
  minPrice: string;
  maxPrice: string;
};

function draftFromQuery(query: ListingQuery): FilterDraft {
  return {
    city: query.city ?? "",
    keyword: query.keyword ?? "",
    listingType: query.listingType ?? "all",
    category: query.category ?? "all",
    status: query.status ?? "all",
    propertyType: query.propertyType ?? "all",
    bedrooms: query.bedrooms === undefined ? "all" : String(query.bedrooms),
    minPrice: query.minPrice === undefined ? "" : String(query.minPrice),
    maxPrice: query.maxPrice === undefined ? "" : String(query.maxPrice),
  };
}

function SearchFilters({
  query,
  onChange,
  open,
  onToggle,
}: {
  query: ListingQuery;
  onChange: (next: Partial<ListingQuery>) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const [draft, setDraft] = useState(() => draftFromQuery(query));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({
      city: draft.city.trim() || undefined,
      keyword: draft.keyword.trim() || undefined,
      listingType: draft.listingType === "all" ? undefined : draft.listingType as ListingQuery["listingType"],
      category: draft.category === "all" ? undefined : draft.category as ListingQuery["category"],
      status: draft.status === "all" ? undefined : draft.status as ListingQuery["status"],
      propertyType: draft.propertyType === "all" ? undefined : draft.propertyType,
      bedrooms: draft.bedrooms === "all" ? undefined : Number(draft.bedrooms),
      minPrice: draft.minPrice ? Number(draft.minPrice) : undefined,
      maxPrice: draft.maxPrice ? Number(draft.maxPrice) : undefined,
    });
  }

  const fields = (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="filter-location">Location</Label>
        <Input id="filter-location" autoComplete="off" placeholder="City, area, or landmark" value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-keyword">Keyword</Label>
        <Input id="filter-keyword" placeholder="e.g. furnished, garden" value={draft.keyword} onChange={(event) => setDraft({ ...draft, keyword: event.target.value })} />
      </div>
      <FilterSelect label="Listing type" value={draft.listingType} onValueChange={(listingType) => setDraft({ ...draft, listingType })} options={[["all", "Buy or rent"], ["SALE", "For sale"], ["RENT", "For rent"]]} />
      <FilterSelect label="Property status" value={draft.status} onValueChange={(status) => setDraft({ ...draft, status })} options={[["all", "Any status"], ["AVAILABLE", "Available"], ["PENDING", "Pending"], ["SOLD", "Sold"], ["RENTED", "Rented"]]} />
      <FilterSelect label="Property type" value={draft.propertyType} onValueChange={(propertyType) => setDraft({ ...draft, propertyType })} options={[["all", "Any type"], ["APARTMENT", "Apartment / flat"], ["HOUSE", "House"], ["LAND", "Land"], ["COMMERCIAL", "Commercial"]]} />
      <FilterSelect label="More options" value={draft.category} onValueChange={(category) => setDraft({ ...draft, category })} options={[["all", "All categories"], ["SHORTLET", "Short-let"], ["NEWHOMES", "New homes"]]} />
      <FilterSelect label="Bedrooms" value={draft.bedrooms} onValueChange={(bedrooms) => setDraft({ ...draft, bedrooms })} options={[["all", "Any bedrooms"], ["1", "1+ bedrooms"], ["2", "2+ bedrooms"], ["3", "3+ bedrooms"], ["4", "4+ bedrooms"], ["5", "5+ bedrooms"]]} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium leading-none">Price range (₦)</legend>
        <div className="grid grid-cols-2 gap-2">
          <Input aria-label="Minimum price" type="number" min="0" inputMode="numeric" placeholder="Min" value={draft.minPrice} onChange={(event) => setDraft({ ...draft, minPrice: event.target.value })} />
          <Input aria-label="Maximum price" type="number" min="0" inputMode="numeric" placeholder="Max" value={draft.maxPrice} onChange={(event) => setDraft({ ...draft, maxPrice: event.target.value })} />
        </div>
      </fieldset>
      <Button type="submit" className="w-full">Apply filters</Button>
    </form>
  );

  return (
    <aside className="self-start rounded-2xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-24 lg:p-5">
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls="listing-filter-fields" className="flex w-full items-center justify-between font-heading text-lg font-semibold lg:cursor-default">
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

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = useMemo(() => parseListingQuery(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const properties = useMemo(() => filterPreviewProperties(PREVIEW_PROPERTIES, query), [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => setFavoriteIds(getFavoriteIds()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function updateQuery(next: Partial<ListingQuery>) {
    const merged = { ...query, ...next };
    if (merged.listingType === "SALE" && merged.category === "SHORTLET") delete merged.category;
    const params = listingQueryToSearchParams(merged);
    const suffix = params.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname);
  }

  const activeFilters: { key: keyof ListingQuery; label: string }[] = [
    ...(query.city ? [{ key: "city" as const, label: `Area: ${query.city}` }] : []),
    ...(query.keyword ? [{ key: "keyword" as const, label: `Keyword: ${query.keyword}` }] : []),
    ...(query.listingType ? [{ key: "listingType" as const, label: query.listingType === "SALE" ? "For sale" : "For rent" }] : []),
    ...(query.status ? [{ key: "status" as const, label: ({ AVAILABLE: "Available", PENDING: "Pending", SOLD: "Sold", RENTED: "Rented" })[query.status] }] : []),
    ...(query.category ? [{ key: "category" as const, label: query.category === "SHORTLET" ? "Short-let" : "New homes" }] : []),
    ...(query.propertyType ? [{ key: "propertyType" as const, label: query.propertyType }] : []),
    ...(query.bedrooms !== undefined ? [{ key: "bedrooms" as const, label: `${query.bedrooms}+ beds` }] : []),
    ...(query.minPrice !== undefined ? [{ key: "minPrice" as const, label: `From ${formatPrice(query.minPrice)}` }] : []),
    ...(query.maxPrice !== undefined ? [{ key: "maxPrice" as const, label: `Up to ${formatPrice(query.maxPrice)}` }] : []),
    ...(query.sort && query.sort !== "newest" ? [{ key: "sort" as const, label: query.sort === "price-asc" ? "Price: low to high" : "Price: high to low" }] : []),
  ];
  const typeLabels: Record<string, string> = { APARTMENT: "apartments", HOUSE: "houses", LAND: "land", COMMERCIAL: "commercial properties" };
  const heading = query.status === "SOLD" ? "Sold properties" : query.status === "RENTED" ? "Rented properties" : query.category === "SHORTLET" ? "Short-let homes" : query.category === "NEWHOMES" ? "New homes" : [query.bedrooms ? `${query.bedrooms}+ bedroom` : "", query.propertyType ? typeLabels[query.propertyType] ?? query.propertyType.toLowerCase() : "properties", query.listingType === "RENT" ? "for rent" : query.listingType === "SALE" ? "for sale" : "", query.city ? `in ${query.city}` : ""].filter(Boolean).join(" ") || "All properties";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
        <SearchFilters key={searchParams.toString()} query={query} onChange={updateQuery} open={mobileFiltersOpen} onToggle={() => setMobileFiltersOpen((value) => !value)} />
        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-heading text-3xl font-semibold">{heading}</h1>
              <p className="mt-1 text-muted-foreground">{properties.length} {properties.length === 1 ? "property" : "properties"} found</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="sort-listings">Sort listings</label>
              <Select value={query.sort ?? "newest"} onValueChange={(sort) => updateQuery({ sort: sort as ListingQuery["sort"] })}>
                <SelectTrigger id="sort-listings" className="w-auto min-w-36"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="price-asc">Price: low to high</SelectItem><SelectItem value="price-desc">Price: high to low</SelectItem></SelectContent>
              </Select>
              <Button size="sm" variant="outline" asChild><Link href={`/map?${listingQueryToSearchParams(query).toString()}`}>Map view</Link></Button>
            </div>
          </div>
          {activeFilters.length > 0 && <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="Active filters">{activeFilters.map(({ key, label }) => <button key={key} type="button" onClick={() => updateQuery({ [key]: undefined })} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-input bg-card px-3 text-xs hover:bg-secondary" aria-label={`Remove ${label} filter`}>{label}<X className="h-3.5 w-3.5" /></button>)}<Button size="sm" variant="ghost" onClick={() => router.replace(pathname)}>Clear all</Button></div>}
          {properties.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-5 py-16 text-center">
              <p className="text-lg font-medium">{query.status === "SOLD" ? "No sold properties in the preview yet." : query.status === "RENTED" ? "No rented properties in the preview yet." : "No preview properties match those filters."}</p>
              <p className="mt-2 text-sm text-muted-foreground">{query.status === "SOLD" || query.status === "RENTED" ? "This page uses sample listings while the marketplace is being built." : "Try widening your search or clearing some filters."}</p>
              <Button variant="link" asChild><Link href="/listings">Clear filters</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => <ListingCard key={property.id} property={property} favorite={favoriteIds.includes(property.id)} onFavorite={() => setFavoriteIds(saveFavorite(property.id))} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return <div><div className="border-b border-border bg-secondary/30 px-4 py-3 text-center text-sm text-muted-foreground">Preview mode — results are using local sample data until the listings API is connected.</div><Suspense fallback={<div className="container mx-auto px-4 py-8 text-muted-foreground">Loading listings…</div>}><ListingsContent /></Suspense></div>;
}
