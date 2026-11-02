import Link from "next/link";
import { ArrowRight, ClipboardCheck, Flag, UsersRound } from "lucide-react";
import { AdminPageHeading } from "@/components/admin/page-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminListingQueue, getAdminReports } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [submitted, underReview, openReports] = await Promise.all([
    getAdminListingQueue({ state: "SUBMITTED", page: 1, size: 1 }),
    getAdminListingQueue({ state: "UNDER_REVIEW", page: 1, size: 1 }),
    getAdminReports("OPEN", 1, 1),
  ]);
  const waitingCount = submitted.total + underReview.total;

  return (
    <div>
      <AdminPageHeading
        eyebrow="Trust & safety"
        title="Review workspace"
        description="Work through listing decisions, investigate reports, and manage account access."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)] lg:gap-14">
        <section className="relative isolate overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
          <div className="absolute -right-10 -top-12 -z-10 size-56 rounded-full border border-white/10" aria-hidden="true" />
          <div className="absolute -right-2 -top-4 -z-10 size-40 rounded-full border border-white/10" aria-hidden="true" />
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">
            <ClipboardCheck className="size-4" aria-hidden="true" /> Listing review
          </div>
          <div className="mt-8 flex flex-wrap items-end gap-x-3 gap-y-1">
            <p className="font-heading text-6xl font-semibold leading-none tabular-nums sm:text-7xl">{waitingCount}</p>
            <p className="pb-1 text-sm text-primary-foreground/75">{waitingCount === 1 ? "listing needs" : "listings need"} a decision</p>
          </div>
          <p className="mt-4 max-w-lg text-sm leading-6 text-primary-foreground/75">
            Submitted and under-review listings are kept out of public search until a reviewer approves them.
          </p>
          <Button asChild variant="secondary" className="mt-7">
            <Link href="/admin/listings">Open review queue <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </Button>
        </section>

        <section className="self-center">
          <h2 className="mb-2 font-heading text-xl font-semibold">Other work</h2>
          <p className="mb-3 text-sm text-muted-foreground">Reports and account access need a separate review.</p>
          <div className="divide-y divide-border border-y border-border">
            <Link href="/admin/reports" className="group flex items-center gap-3 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <Flag className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Reports</span>
                <span className="block text-sm text-muted-foreground">Investigate seeker reports</span>
              </span>
              <Badge variant={openReports.total > 0 ? "warning" : "secondary"} className="tabular-nums">
                {openReports.total} open
              </Badge>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link href="/admin/users" className="group flex items-center gap-3 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <UsersRound className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Users</span>
                <span className="block text-sm text-muted-foreground">Search accounts and access</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
