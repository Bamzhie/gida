import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import { AdminPageHeading } from "@/components/admin/page-heading";
import { getAdminListingQueue } from "@/lib/admin";
import { adminListingHref } from "@/lib/admin-listing-url";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review queue",
  description: "Listings awaiting a moderation decision.",
};

const TABS = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "UNDER_REVIEW", label: "Under review" },
  { key: "PUBLISHED", label: "Published" },
  { key: "REJECTED", label: "Rejected" },
  { key: "stale", label: "Stale 30+ days" },
];

const LIFECYCLE_VARIANTS: Record<string, "secondary" | "success" | "warning" | "outline"> = {
  DRAFT: "secondary",
  SUBMITTED: "warning",
  UNDER_REVIEW: "warning",
  PUBLISHED: "success",
  PAUSED: "warning",
  EXPIRED: "secondary",
  REJECTED: "secondary",
  SUSPENDED: "secondary",
};

type Props = {
  searchParams: Promise<{ state?: string; staleDays?: string; page?: string }>;
};

export default async function AdminListingsPage({ searchParams }: Props) {
  const { state: rawState, staleDays: rawStaleDays, page: rawPage } = await searchParams;
  const isStale = rawState === "stale" || rawStaleDays === "30";
  const state = isStale ? undefined : rawState;
  const page = Math.max(1, Number(rawPage) || 1);

  const queue = await getAdminListingQueue({
    state,
    staleDays: isStale ? 30 : undefined,
    page,
    size: 25,
  });

  const activeTab = isStale ? "stale" : (rawState ?? "");
  const queueHref = (nextPage?: number) => {
    const params = new URLSearchParams();
    if (isStale) params.set("staleDays", "30");
    else if (rawState) params.set("state", rawState);
    if (nextPage) params.set("page", String(nextPage));
    const query = params.toString();
    return `/admin/listings${query ? `?${query}` : ""}`;
  };

  return (
    <div>
      <AdminPageHeading
        eyebrow="Moderation"
        title="Review queue"
        description="Check listing details, evidence, and advertiser claims before they go live."
      />

      <section aria-label="Filter listings by status" className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Show</p>
        <div className="flex flex-wrap gap-1.5">
          <Button asChild variant={activeTab === "" ? "secondary" : "ghost"} size="sm">
            <Link href="/admin/listings" aria-current={activeTab === "" ? "page" : undefined}>All</Link>
          </Button>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Button key={tab.key} asChild variant={active ? "secondary" : "ghost"} size="sm">
                <Link
                  href={tab.key === "stale" ? "/admin/listings?staleDays=30" : `/admin/listings?state=${tab.key}`}
                  aria-current={active ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </section>

      {queue.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-5 py-12 text-center sm:py-16">
          <span className="mx-auto mb-4 grid size-11 place-items-center rounded-full bg-secondary text-secondary-foreground">
            <MapPin className="size-5" aria-hidden="true" />
          </span>
          <h2 className="font-heading text-lg font-semibold">Nothing to review here</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            {isStale ? "No published listings have passed the 30-day freshness mark." : "There are no listings in this status right now. Try another filter."}
          </p>
        </div>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {queue.items.map((listing) => (
              <li key={listing.id}>
                <Button asChild variant="ghost" className="h-auto w-full whitespace-normal rounded-2xl bg-transparent p-0 text-left text-card-foreground shadow-none hover:bg-transparent hover:text-card-foreground">
                  <Link
                    href={adminListingHref(listing)}
                    className="group flex h-full min-h-52 flex-col rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-heading font-semibold leading-5 text-card-foreground group-hover:underline">{listing.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {[listing.area, listing.state].filter(Boolean).join(", ") || "No location"}
                        </p>
                      </div>
                      <Badge variant={LIFECYCLE_VARIANTS[listing.lifecycle] ?? "outline"} className="shrink-0">
                        {listing.lifecycle.replace(/_/g, " ").toLowerCase()}
                      </Badge>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Advertiser</p>
                        <p className="truncate font-medium text-card-foreground">{listing.advertiserName}</p>
                        <p className="truncate text-xs text-muted-foreground">{listing.advertiserEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="font-semibold tabular-nums">{formatPrice(listing.price)}</p>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-xs text-muted-foreground">
                      <span>{listing.submittedAt ? `Submitted ${formatDate(listing.submittedAt)}` : `Created ${formatDate(listing.createdAt)}`}</span>
                      {listing.confirmedAt && <span>Confirmed {formatDate(listing.confirmedAt)}</span>}
                    </div>

                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      Open review <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                </Button>
              </li>
            ))}
          </ul>

          {queue.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {queue.page} of {queue.pages} · {queue.total} listing{queue.total === 1 ? "" : "s"}
              </span>
              <div className="flex gap-2">
                {queue.page > 1 && (
                  <Button asChild variant="outline" size="sm" className="rounded-xl">
                    <Link href={queueHref(queue.page - 1)}>
                      Previous
                    </Link>
                  </Button>
                )}
                {queue.page < queue.pages && (
                  <Button asChild variant="outline" size="sm" className="rounded-xl">
                    <Link href={queueHref(queue.page + 1)}>
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
