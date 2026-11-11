import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/marketplace/listing-card";
import { getFavoriteListings } from "@/lib/favorites";
import { ACCESS_COOKIE, API_ORIGIN } from "@/lib/api-base";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) redirect(`/login?next=${encodeURIComponent("/favorites")}`);

  const [listings, user] = await Promise.all([getFavoriteListings(), getCurrentUser()]);

  const content = (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Saved properties</h1>
          <p className="mt-1 text-muted-foreground">Sign in on another device and this list travels with you.</p>
        </div>
        <Button variant="outline" asChild><Link href="/listings">Explore listings</Link></Button>
      </div>

      {listings.length === 0 ? (
        <Card className="mx-auto max-w-lg text-center">
          <CardContent className="pt-10 pb-10">
            <Heart className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No saved properties yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Tap the heart on any listing to keep it here.</p>
            <Button className="mt-5" asChild><Link href="/listings">Browse properties</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={`${listing.id}-s`} listing={listing} saved mediaOrigin={API_ORIGIN} />
          ))}
        </div>
      )}
    </div>
  );

  return user?.role === "USER" ? <DashboardShell role="USER">{content}</DashboardShell> : content;
}
