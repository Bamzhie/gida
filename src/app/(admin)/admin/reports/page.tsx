import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReportActions } from "@/components/admin/report-actions";
import { AdminPageHeading } from "@/components/admin/page-heading";
import { getAdminReports } from "@/lib/admin";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports",
  description: "Listings flagged by seekers.",
};

const TABS = [
  { key: "OPEN", label: "Open" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "DISMISSED", label: "Dismissed" },
];

const REASON_LABELS: Record<string, string> = {
  FRAUD: "Scam or fraud",
  WRONG_PRICE: "Wrong price",
  UNAVAILABLE: "No longer available",
  DUPLICATE: "Duplicate listing",
  OFFENSIVE: "Offensive content",
  OTHER: "Other",
};

type Props = { searchParams: Promise<{ status?: string; page?: string }> };

export default async function AdminReportsPage({ searchParams }: Props) {
  const { status: rawStatus, page: rawPage } = await searchParams;
  const status = rawStatus ?? "OPEN";
  const page = Math.max(1, Number(rawPage) || 1);
  const reports = await getAdminReports(status, page, 25);

  return (
    <div>
      <AdminPageHeading
        eyebrow="Trust & safety"
        title="Reports"
        description="Review seeker reports and record the outcome of each investigation."
      />

      <div className="mb-5 flex flex-wrap gap-1" aria-label="Filter reports by status">
        {TABS.map((tab) => (
          <Button
            key={tab.key}
            asChild
            variant={status === tab.key ? "secondary" : "ghost"}
            size="sm"
            className="rounded-xl"
          >
            <Link href={`/admin/reports?status=${tab.key}`} aria-current={status === tab.key ? "page" : undefined}>{tab.label}</Link>
          </Button>
        ))}
      </div>

      {reports.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/60 px-5 py-12 text-center text-sm text-muted-foreground">
          No {status.toLowerCase()} reports.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {reports.items.map((report) => (
            <li key={report.id} className="p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">{REASON_LABELS[report.reason] ?? report.reason}</Badge>
                    <Link
                      href={`/admin/listings/${report.listingId}`}
                      className="font-medium hover:underline"
                    >
                      {report.listingTitle}
                    </Link>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reported by {report.reporterEmail} · {formatDate(report.createdAt)}
                  </p>
                  {report.details && (
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{report.details}</p>
                  )}
                  {report.resolvedAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Closed {formatDate(report.resolvedAt)}
                    </p>
                  )}
                </div>
                <div className="w-full">
                  <ReportActions reportId={report.id} status={report.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {reports.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {reports.page} of {reports.pages} · {reports.total} report{reports.total === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            {reports.page > 1 && (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href={`/admin/reports?status=${status}&page=${reports.page - 1}`}>Previous</Link>
              </Button>
            )}
            {reports.page < reports.pages && (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href={`/admin/reports?status=${status}&page=${reports.page + 1}`}>Next</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
