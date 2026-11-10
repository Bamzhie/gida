import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Heart, Plus, Search } from "lucide-react";
import { ListingCard } from "@/components/marketplace/listing-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFavoriteListings } from "@/lib/favorites";
import { getMyRequests } from "@/lib/requests";
import { getCurrentUser } from "@/lib/session";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Buyer dashboard",
  description: "Pick up your property search and manage saved homes and requests.",
};

export default async function BuyerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fdashboard%2Fbuyer");
  if (user.role !== "USER") redirect(user.role === "ADMIN" ? "/admin" : "/dashboard/agent");

  const [favorites, requests] = await Promise.all([
    getFavoriteListings(),
    getMyRequests(3),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Welcome back, {user.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your shortlist and property requests are ready when you are.</p>
        </div>
        <Button asChild className="rounded-xl"><Link href="/listings"><Search aria-hidden="true" /> Browse properties</Link></Button>
      </div>

      <section aria-labelledby="saved-properties-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 id="saved-properties-heading" className="flex items-center gap-2 font-heading text-lg font-semibold">
              <Heart className="size-4 text-primary" aria-hidden="true" /> Saved properties
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{favorites.length} {favorites.length === 1 ? "home" : "homes"} in your shortlist.</p>
          </div>
          {favorites.length > 0 && <Button asChild variant="ghost" size="sm" className="rounded-xl"><Link href="/favorites">View all <ArrowRight aria-hidden="true" /></Link></Button>}
        </div>
        {favorites.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-start gap-3 py-7 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Save properties you like and compare them here.</p>
              <Button asChild variant="outline" className="rounded-xl"><Link href="/listings">Find a home</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.slice(0, 3).map((listing) => <ListingCard key={listing.id} listing={listing} saved />)}
          </div>
        )}
      </section>

      <section aria-labelledby="property-requests-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 id="property-requests-heading" className="font-heading text-lg font-semibold">Property requests</h3>
            <p className="mt-1 text-sm text-muted-foreground">Tell advertisers what you need, or update a request that’s already open.</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl"><Link href="/requests"><Plus aria-hidden="true" /> Post a request</Link></Button>
        </div>
        {requests.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-7">
              <p className="text-sm text-muted-foreground">You haven’t posted a property request yet.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {requests.map((request) => (
              <li key={request.id}>
                <Card className="h-full rounded-2xl">
                  <CardContent className="pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold">{request.title}</h4>
                      <Badge variant={request.status === "OPEN" ? "success" : "outline"}>{request.status === "OPEN" ? "Open" : "Closed"}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {[request.area, request.propertyType?.replaceAll("_", " ").toLowerCase(),
                        request.bedrooms !== null ? request.bedrooms + " bedrooms" : null]
                        .filter(Boolean).join(" · ") || "Any area"}
                    </p>
                    {(request.maxPrice !== null || request.minPrice !== null) && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Budget {request.minPrice !== null ? "from " + formatPrice(request.minPrice) : ""}
                        {request.minPrice !== null && request.maxPrice !== null ? " " : ""}
                        {request.maxPrice !== null ? "up to " + formatPrice(request.maxPrice) : ""}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">Posted {formatDate(request.createdAt)}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
        {requests.length > 0 && <Link href="/requests" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Manage requests <ArrowRight className="size-4" aria-hidden="true" /></Link>}
      </section>
    </div>
  );
}
