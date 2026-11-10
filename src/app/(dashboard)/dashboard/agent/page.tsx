import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, Inbox, Plus, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiGetAuthed } from "@/lib/api";
import type { AdvertiserSummaryDto, EnquiryDto, MatchingRequestDto, PageResponse } from "@/lib/api-types";
import { getAmenityLabels } from "@/lib/listings";
import { getMatchingRequests } from "@/lib/requests";
import { getCurrentUser } from "@/lib/session";
import { formatDate, formatPrice } from "@/lib/utils";
import { isEmail } from "@/lib/validate";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Agent dashboard",
  description: "Manage your Gida listings, enquiries and property requests.",
};

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-secondary/50 px-4 py-3">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function requestSummary(request: MatchingRequestDto): string {
  return (
    [request.area, request.bedrooms !== null ? request.bedrooms + " beds" : null,
      request.maxPrice !== null ? "up to " + formatPrice(request.maxPrice) : null]
      .filter(Boolean).join(" · ") || "Anywhere · no bedrooms or budget set"
  );
}

export default async function AgentDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fdashboard%2Fagent");
  if (user.role !== "AGENT") redirect(user.role === "ADMIN" ? "/admin" : "/dashboard/buyer");

  const [summary, inbox, matching] = await Promise.all([
    apiGetAuthed<AdvertiserSummaryDto>("/me/advertiser-summary"),
    apiGetAuthed<PageResponse<EnquiryDto>>("/me/enquiries", { size: 6 }),
    getMatchingRequests(6),
  ]);
  const amenityLabels = matching.length ? await getAmenityLabels() : {};

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Welcome back, {user.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your listings and customer activity at a glance.</p>
        </div>
        <Button asChild className="rounded-xl"><Link href="/dashboard/agent/listings/new"><Plus aria-hidden="true" /> New listing</Link></Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold">
            <BarChart3 className="size-4" aria-hidden="true" /> Listing performance
          </h3>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <SummaryStat label="Drafts" value={summary.listingsByState.DRAFT ?? 0} />
            <SummaryStat label="Live" value={summary.listingsByState.PUBLISHED ?? 0} />
            <SummaryStat label="Paused" value={summary.listingsByState.PAUSED ?? 0} />
            <SummaryStat label="Enquiries" value={summary.totalEnquiries} />
            <SummaryStat label="Viewing requests" value={summary.totalViewingRequests} />
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            <Link href="/dashboard/agent/listings" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">Manage listings <ArrowRight className="size-4" aria-hidden="true" /></Link>
            <Link href="/dashboard/agent/enquiries" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">Open enquiry inbox <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-heading text-lg font-semibold"><Inbox className="size-4" aria-hidden="true" /> Recent enquiries</h3>
            <Button asChild variant="ghost" size="sm" className="rounded-xl"><Link href="/dashboard/agent/enquiries">View inbox</Link></Button>
          </div>
          {inbox.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enquiries yet. They’ll appear here when someone contacts you about a listing.</p>
          ) : (
            <ul className="divide-y divide-border">
              {inbox.items.map((enquiry) => (
                <li key={enquiry.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={enquiry.action === "VIEWING" ? "secondary" : "outline"}>{enquiry.action === "VIEWING" ? "Viewing request" : "Enquiry"}</Badge>
                    <span className="font-medium">{enquiry.name}</span>
                    <a className="text-sm text-primary hover:underline" href={isEmail(enquiry.contact) ? "mailto:" + enquiry.contact : "tel:" + enquiry.contact.replace(/[^\d+]/g, "")}>{enquiry.contact}</a>
                    <span className="text-xs text-muted-foreground">{formatDate(enquiry.createdAt)}</span>
                  </div>
                  {enquiry.listingTitle && enquiry.listingId && (
                    <p className="mt-1 text-xs text-muted-foreground">About <Link href={"/dashboard/agent/listings/" + enquiry.listingId} className="font-medium hover:underline">{enquiry.listingTitle}</Link></p>
                  )}
                  {enquiry.message && <p className="mt-2 text-sm leading-6">{enquiry.message}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Target className="size-4 text-primary" aria-hidden="true" />
            <div>
              <h3 className="font-heading text-lg font-semibold">Requests matching your listings</h3>
              <p className="text-xs text-muted-foreground">These buyers and renters are looking for a property like yours.</p>
            </div>
          </div>
          {matching.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching property requests right now.</p>
          ) : (
            <ul className="space-y-3">
              {matching.map((request) => (
                <li key={request.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{request.title}</p>
                    <Badge variant="outline">{request.matchedListingIds.length} matching {request.matchedListingIds.length === 1 ? "listing" : "listings"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{requestSummary(request)}</p>
                  {request.notes && <p className="mt-2 text-sm leading-6">{request.notes}</p>}
                  <p className="mt-3 text-xs text-muted-foreground">Contact {request.name} · {request.contact} · Posted {formatDate(request.createdAt)}</p>
                  {request.amenities.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">Looking for: {request.amenities.map((amenity) => amenityLabels[amenity] ?? amenity).join(", ")}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
