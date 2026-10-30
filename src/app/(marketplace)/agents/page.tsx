import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AgentContactForm } from "@/components/marketplace/agent-contact-form";
import { initialsOf, searchAdvertisers } from "@/lib/advertisers";

export const metadata: Metadata = {
  title: "Agents and advertisers",
  description: "Browse the advertisers publishing homes on Gida, with the listings each one has live today.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQuery } = await searchParams;
  const query = rawQuery?.trim() || undefined;
  const directory = await searchAdvertisers({ q: query, size: PAGE_SIZE });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="mb-2 font-heading text-3xl font-bold">Find advertisers</h1>
        <p className="text-muted-foreground">
          Every profile here is an account with listings published on Gida. The listing count is live, not a sample.
        </p>
      </div>

      <form className="mb-8 flex max-w-2xl flex-col gap-3 sm:flex-row" action="/agents">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="agent-search"
            name="q"
            type="search"
            aria-label="Search advertisers"
            placeholder="Search by name, agency or area..."
            className="pl-9"
            defaultValue={query ?? ""}
          />
        </div>
        <Button className="rounded-xl" type="submit">Search advertisers</Button>
      </form>

      {directory.items.length === 0 ? (
        <Card className="mx-auto max-w-lg text-center">
          <CardContent className="pt-10 pb-10">
            <Search className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
            <h2 className="font-semibold">No advertisers match that search</h2>
            <p className="mt-2 text-sm text-muted-foreground">Try a different name, agency or Lagos area.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {directory.items.map((agent) => (
            <Card key={agent.id} className="rounded-2xl">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {initialsOf(agent.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-heading font-semibold">{agent.name}</h3>
                    <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />{agent.agencyName ?? "Independent advertiser"}
                    </p>
                  </div>
                </div>
                {agent.bio && <p className="mb-4 text-sm leading-6 text-muted-foreground">{agent.bio}</p>}
                <p className="mb-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>{agent.phone ?? "No phone disclosed"}</span>
                  <span>{agent.listingCount} live {agent.listingCount === 1 ? "listing" : "listings"}</span>
                </p>
                <Button variant="outline" className="mb-2 w-full rounded-xl" size="sm" asChild>
                  <Link href={`/listings?advertiser=${agent.id}`}>View listings</Link>
                </Button>
                <AgentContactForm advertiserId={agent.id} advertiserName={agent.name} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
