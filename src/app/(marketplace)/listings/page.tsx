"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPin, Bed, Bath, Maximize, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import {
  filterPreviewProperties,
  listingQueryToSearchParams,
  parseListingQuery,
  type ListingQuery,
} from "@/lib/preview-listings";
import { PREVIEW_PROPERTIES } from "@/lib/preview-data";
import { getFavoriteIds, saveFavorite } from "@/lib/preview-storage";

function Building({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>;
}

function SearchFilters({ query, onChange }: { query: ListingQuery; onChange: (next: Partial<ListingQuery>) => void }) {
  return <div className="flex flex-wrap gap-2"><label className="sr-only" htmlFor="listing-type">Listing type</label><select id="listing-type" value={query.listingType ?? ""} onChange={(event) => onChange({ listingType: (event.target.value || undefined) as ListingQuery["listingType"] })} className="h-10 rounded-xl border border-input bg-background px-3 text-sm"><option value="">All listings</option><option value="RENT">For rent</option><option value="SALE">For sale</option></select><label className="sr-only" htmlFor="listing-property-type">Property type</label><select id="listing-property-type" value={query.propertyType ?? ""} onChange={(event) => onChange({ propertyType: event.target.value || undefined })} className="h-10 rounded-xl border border-input bg-background px-3 text-sm"><option value="">Any type</option><option value="APARTMENT">Apartment</option><option value="HOUSE">House</option><option value="TOWNHOUSE">Townhouse</option><option value="CONDO">Condo</option><option value="LAND">Land</option><option value="COMMERCIAL">Commercial</option></select><label className="sr-only" htmlFor="listing-sort">Sort listings</label><select id="listing-sort" value={query.sort ?? "newest"} onChange={(event) => onChange({ sort: event.target.value as ListingQuery["sort"] })} className="h-10 rounded-xl border border-input bg-background px-3 text-sm"><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></div>;
}

function ListingCard({ property, favorite, onFavorite }: { property: (typeof PREVIEW_PROPERTIES)[number]; favorite: boolean; onFavorite: () => void }) {
  return <Card className="group relative overflow-hidden transition-shadow hover:shadow-lg"><Link href={`/listings/${property.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">{property.images[0] ? // eslint-disable-next-line @next/next/no-img-element
    <img src={property.images[0].url} alt={property.title} className="h-full w-full object-cover" /> : <Building className="h-12 w-12 text-primary/30" />}<Badge className="absolute left-3 top-3" variant={property.listingType === "SALE" ? "default" : "secondary"}>For {property.listingType === "SALE" ? "Sale" : "Rent"}</Badge></div></Link><button type="button" aria-label={favorite ? `Remove ${property.title} from favorites` : `Save ${property.title}`} aria-pressed={favorite} onClick={onFavorite} className="absolute right-3 top-3 rounded-full bg-background/85 p-2 backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Heart className={`h-4 w-4 ${favorite ? "fill-accent text-accent" : ""}`} /></button><CardContent className="pt-4"><Link href={`/listings/${property.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><div className="mb-1 flex items-center justify-between gap-2"><span className="text-lg font-bold text-primary">{formatPrice(property.price)}</span><Badge variant="outline">{property.propertyType}</Badge></div><h3 className="mb-1 line-clamp-1 text-sm font-semibold">{property.title}</h3><div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /><span className="line-clamp-1">{property.address}, {property.city}</span></div><div className="flex items-center gap-3 text-xs text-muted-foreground">{property.bedrooms !== null && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{property.bedrooms}</span>}{property.bathrooms !== null && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{property.bathrooms}</span>}{property.sqft && <span className="flex items-center gap-1"><Maximize className="h-3 w-3" />{property.sqft} sqft</span>}</div></Link></CardContent></Card>;
}

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = useMemo(() => parseListingQuery(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
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

  return <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{query.category === "SHORTLET" ? "Short-let homes" : query.category === "NEWHOMES" ? "New homes" : query.city ? `Properties in ${query.city}` : "All Properties"}</h1>
          <p className="mt-1 text-muted-foreground">{properties.length} properties found</p>
        </div>
        <SearchFilters query={query} onChange={updateQuery} />
      </div>
    {properties.length === 0 ? (
      <div className="py-20 text-center"><p className="text-lg text-muted-foreground">No preview properties match those filters.</p><Button variant="link" asChild><Link href="/listings">Clear filters</Link></Button></div>
    ) : (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => <ListingCard key={property.id} property={property} favorite={favoriteIds.includes(property.id)} onFavorite={() => setFavoriteIds(saveFavorite(property.id))} />)}
      </div>
    )}
  </div>;
}

export default function ListingsPage() {
  return <div><div className="border-b border-border bg-secondary/30 px-4 py-3 text-center text-sm text-muted-foreground">Preview mode — results are using local sample data until the listings API is connected.</div><Suspense fallback={<div className="container mx-auto px-4 py-8 text-muted-foreground">Loading listings…</div>}><ListingsContent /></Suspense></div>;
}
