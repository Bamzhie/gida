"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, Bed, Bath, Maximize, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";

interface Property {
  id: string;
  title: string;
  price: number;
  listingType: string;
  propertyType: string;
  address: string;
  city: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  images: { url: string; caption: string | null }[];
  status: string;
}

function Building({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
    </svg>
  );
}

function ListingsContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const city = searchParams.get("city") || "";
  const listingType = searchParams.get("listingType") || "";
  const propertyType = searchParams.get("propertyType") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      if (listingType) params.set("listingType", listingType);
      if (propertyType) params.set("propertyType", propertyType);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      params.set("page", page.toString());

      try {
        const res = await fetch(`/api/listings?${params}`);
        const data = await res.json();
        setProperties(data.properties || []);
        setTotalPages(data.pagination?.pages || 1);
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, [city, listingType, propertyType, minPrice, maxPrice, page]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {city ? `Properties in ${city}` : "All Properties"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {properties.length} properties found
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={listingType} onValueChange={() => {}}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SALE">For Sale</SelectItem>
              <SelectItem value="RENT">For Rent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={propertyType} onValueChange={() => {}}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="APARTMENT">Apartment</SelectItem>
              <SelectItem value="HOUSE">House</SelectItem>
              <SelectItem value="CONDO">Condo</SelectItem>
              <SelectItem value="COMMERCIAL">Commercial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">No properties found</p>
          <Button variant="link" asChild>
            <Link href="/listings">Clear filters</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link key={property.id} href={`/listings/${property.id}`}>
              <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  {property.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={property.images[0].url}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building className="h-12 w-12 text-primary/30" />
                  )}
                  <Badge
                    className="absolute top-3 left-3"
                    variant={property.listingType === "SALE" ? "default" : "secondary"}
                  >
                    For {property.listingType === "SALE" ? "Sale" : "Rent"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(property.price)}
                    </span>
                    <Badge variant="outline">{property.propertyType}</Badge>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">{property.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{property.address}, {property.city}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {property.bedrooms && (
                      <span className="flex items-center gap-1">
                        <Bed className="h-3 w-3" />{property.bedrooms}
                      </span>
                    )}
                    {property.bathrooms && (
                      <span className="flex items-center gap-1">
                        <Bath className="h-3 w-3" />{property.bathrooms}
                      </span>
                    )}
                    {property.sqft && (
                      <span className="flex items-center gap-1">
                        <Maximize className="h-3 w-3" />{property.sqft} sqft
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ListingsContent />
    </Suspense>
  );
}
