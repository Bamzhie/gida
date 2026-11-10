import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiGetAuthed } from "@/lib/api";
import type { EnquiryDto, PageResponse } from "@/lib/api-types";
import { getCurrentUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { isEmail } from "@/lib/validate";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Enquiry inbox",
  description: "See messages and viewing requests about your listings.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AgentEnquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fdashboard%2Fagent%2Fenquiries");
  if (user.role !== "AGENT") redirect(user.role === "ADMIN" ? "/admin" : "/dashboard/buyer");

  const params = await searchParams;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const requestedPage = Number(rawPage);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const response = await apiGetAuthed<PageResponse<EnquiryDto>>("/me/enquiries", { page, size: 20 });

  return (
    <div>
      <div className="mb-7">
        <h2 className="font-heading text-xl font-semibold">Enquiry inbox</h2>
        <p className="mt-1 text-sm text-muted-foreground">{response.total} messages and viewing requests about your properties.</p>
      </div>
      {response.items.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center">
            <Inbox className="mx-auto mb-4 size-9 text-muted-foreground" aria-hidden="true" />
            <h3 className="font-heading text-lg font-semibold">No enquiries yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">When someone contacts you about a property, the conversation will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="space-y-3">
            {response.items.map((enquiry) => (
              <li key={enquiry.id}>
                <Card className="rounded-2xl">
                  <CardContent className="pt-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={enquiry.action === "VIEWING" ? "secondary" : "outline"}>
                        {enquiry.action === "VIEWING" ? "Viewing request" : "Enquiry"}
                      </Badge>
                      <h3 className="font-semibold">{enquiry.name}</h3>
                      <span className="text-xs text-muted-foreground">{formatDate(enquiry.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-sm">
                      Contact:{" "}
                      <a href={isEmail(enquiry.contact) ? "mailto:" + enquiry.contact : "tel:" + enquiry.contact.replace(/[^\d+]/g, "")} className="font-medium text-primary hover:underline">
                        {enquiry.contact}
                      </a>
                    </p>
                    {enquiry.listingTitle && enquiry.listingId && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        About <Link href={"/dashboard/agent/listings/" + enquiry.listingId} className="font-medium text-foreground hover:underline">{enquiry.listingTitle}</Link>
                      </p>
                    )}
                    {enquiry.message && <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{enquiry.message}</p>}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          {response.pages > 1 && (
            <nav aria-label="Enquiry pages" className="mt-6 flex items-center justify-between">
              {page > 1 ? (
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href={"/dashboard/agent/enquiries?page=" + (page - 1)}><ArrowLeft aria-hidden="true" /> Previous</Link>
                </Button>
              ) : <span />}
              <span className="text-sm text-muted-foreground">Page {response.page} of {response.pages}</span>
              {page < response.pages ? (
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href={"/dashboard/agent/enquiries?page=" + (page + 1)}>Next <ArrowRight aria-hidden="true" /></Link>
                </Button>
              ) : <span />}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
