import Link from "next/link";
import { Building2, Inbox, LogIn, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiGetAuthed } from "@/lib/api";
import { getAmenityLabels } from "@/lib/listings";
import { getMatchingRequests } from "@/lib/requests";
import { getCurrentUser } from "@/lib/session";
import { formatDate, formatPrice } from "@/lib/utils";
import { isEmail } from "@/lib/validate";
import type { EnquiryDto, MatchingRequestDto, PageResponse } from "@/lib/api-types";

export const dynamic = "force-dynamic";

/** The same "area · N beds · up to ₦X" line the requests page renders, for one use here. */
function requestSummary(request: MatchingRequestDto): string {
  return (
    [request.area, request.bedrooms !== null ? `${request.bedrooms} beds` : null,
      request.maxPrice !== null ? `up to ${formatPrice(request.maxPrice)}` : null]
      .filter(Boolean).join(" · ") || "Anywhere · no bedrooms or budget set"
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-6">Sign in to access your dashboard.</p>
        <Button asChild>
          <Link href="/login">
            <LogIn className="h-4 w-4" />
            Sign in
          </Link>
        </Button>
      </div>
    );
  }

  const isInboxVisible = user.role === "AGENT" || user.role === "ADMIN";
  const inbox = isInboxVisible
    ? (await apiGetAuthed<PageResponse<EnquiryDto>>("/me/enquiries", { size: 10 })).items
    : [];
  const matching = isInboxVisible ? await getMatchingRequests(10) : [];
  const amenityLabels = matching.length > 0 ? await getAmenityLabels() : {};

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="font-heading text-2xl font-bold">Welcome back, {user.name}</h1>
      <p className="mt-2 text-muted-foreground">{user.email}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/favorites">Saved properties</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/listings">Browse listings</Link>
        </Button>
      </div>
      {isInboxVisible && (
        <Card className="mt-8 rounded-2xl">
          <CardContent className="pt-6">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold">
              <Inbox className="h-4 w-4" /> Recent enquiries
            </h2>
            {inbox.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enquiries yet.</p>
            ) : (
              <ul className="space-y-4">
                {inbox.map((enquiry) => (
                  <li key={enquiry.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={enquiry.action === "VIEWING" ? "secondary" : "outline"}>
                        {enquiry.action === "VIEWING" ? "Viewing request" : "Enquiry"}
                      </Badge>
                      <span className="font-medium">{enquiry.name}</span>
                      <a
                        href={isEmail(enquiry.contact) ? `mailto:${enquiry.contact}` : `tel:${enquiry.contact}`}
                        className="text-sm text-primary underline-offset-4 hover:underline"
                      >
                        {enquiry.contact}
                      </a>
                      <span className="ml-auto text-xs text-muted-foreground">{formatDate(enquiry.createdAt)}</span>
                    </div>
                    {enquiry.listingId ? (
                      <Link href={`/listings/${enquiry.listingId}`} className="mt-1 block text-sm hover:underline">
                        {enquiry.listingTitle}
                      </Link>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">General enquiry</p>
                    )}
                    {enquiry.message && (
                      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{enquiry.message}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
      {isInboxVisible && (
        <Card className="mt-8 rounded-2xl">
          <CardContent className="pt-6">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold">
              <Target className="h-4 w-4" /> Matching requests
            </h2>
            {matching.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open requests match your live listings.</p>
            ) : (
              <ul className="space-y-4">
                {matching.map((request) => (
                  <li key={request.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{request.title}</span>
                      <Badge variant="secondary">
                        {request.matchedListingIds.length}{" "}
                        {request.matchedListingIds.length === 1 ? "listing" : "listings"} match
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{requestSummary(request)}</p>
                    {request.amenities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {request.amenities.map((slug) => (
                          <Badge key={slug} variant="outline">{amenityLabels[slug] ?? slug}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {request.neededBy && <span>Needed by {formatDate(request.neededBy)}</span>}
                      <span>
                        {request.name} ·{" "}
                        <a
                          href={isEmail(request.contact) ? `mailto:${request.contact}` : `tel:${request.contact}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {request.contact}
                        </a>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
