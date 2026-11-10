import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RequestForm } from "@/components/marketplace/request-form";
import { getMyRequests, hasSession } from "@/lib/requests";
import { getAmenities, getLocations } from "@/lib/listings";
import { formatPrice } from "@/lib/utils";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Post a property request",
  description: "Describe the home you are looking for and let the advertisers who cover that area find you.",
};

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const [signedIn, user] = await Promise.all([hasSession(), getCurrentUser()]);
  const [areas, amenities, mine] = await Promise.all([
    getLocations(),
    getAmenities(),
    signedIn ? getMyRequests() : Promise.resolve([]),
  ]);

  const content = (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4 gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Property requests
        </Badge>
        <h1 className="mb-2 font-heading text-3xl font-bold">Post a property request</h1>
        <p className="text-muted-foreground">
          Tell the advertisers already publishing in your area what you are looking for. Advertisers whose live listings
          match your request see it, with your contact details.
        </p>
      </div>

      <RequestForm areas={areas} amenities={amenities} />

      {mine.length > 0 && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <h2 className="font-heading text-lg font-semibold">Your requests</h2>
            <ul className="mt-3 space-y-3">
              {mine.map((request) => (
                <li key={request.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{request.title}</p>
                    {request.status === "CLOSED" && <Badge variant="outline">Closed</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[request.area, request.bedrooms !== null ? `${request.bedrooms} beds` : null,
                      request.maxPrice !== null ? `up to ${formatPrice(request.maxPrice)}` : null]
                      .filter(Boolean).join(" · ") || "Anywhere · no bedrooms or budget set"}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return user?.role === "USER" ? <DashboardShell role="USER">{content}</DashboardShell> : content;
}
