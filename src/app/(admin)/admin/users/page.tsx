import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserActions } from "@/components/admin/user-actions";
import { AdminPageHeading } from "@/components/admin/page-heading";
import { getAdminUsers } from "@/lib/admin";
import { getCurrentUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Users",
  description: "Search accounts and manage suspension.",
};

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "SUSPENDED", label: "Suspended" },
];

type Props = { searchParams: Promise<{ q?: string; status?: string; page?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const { q: rawQuery, status: rawStatus, page: rawPage } = await searchParams;
  const query = rawQuery?.trim() || undefined;
  const status = rawStatus || undefined;
  const page = Math.max(1, Number(rawPage) || 1);

  const [users, viewer] = await Promise.all([getAdminUsers(query, status, page, 25), getCurrentUser()]);

  return (
    <div>
      <AdminPageHeading
        eyebrow="Trust & safety"
        title="Users"
        description="Find accounts and manage access when a case requires action."
      />

      <form className="mb-5 flex max-w-xl flex-col gap-2 sm:flex-row" action="/admin/users">
        {status && <input type="hidden" name="status" value={status} />}
        <Input
          name="q"
          type="search"
          aria-label="Search accounts"
          placeholder="Search by name or email"
          defaultValue={query ?? ""}
        />
        <Button type="submit" className="rounded-xl">Search</Button>
      </form>

      <div className="mb-5 flex flex-wrap gap-1" aria-label="Filter accounts by status">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.key || "all"}
            asChild
            variant={(status ?? "") === tab.key ? "secondary" : "ghost"}
            size="sm"
            className="rounded-xl"
          >
            <Link href={`/admin/users${tab.key ? `?status=${tab.key}` : ""}${query ? `${tab.key ? "&" : "?"}q=${encodeURIComponent(query)}` : ""}`} aria-current={(status ?? "") === tab.key ? "page" : undefined}>
              {tab.label}
            </Link>
          </Button>
        ))}
      </div>

      {users.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/60 px-5 py-12 text-center text-sm text-muted-foreground">
          No accounts match that search.
        </p>
      ) : (
        <>
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card md:hidden">
          {users.items.map((user) => (
            <li key={user.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="font-medium">{user.name}</p><p className="break-all text-xs text-muted-foreground">{user.email}</p></div>
                <Badge variant={user.status === "ACTIVE" ? "success" : "secondary"}>{user.status.toLowerCase()}</Badge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <span><Badge variant="outline">{user.role.toLowerCase()}</Badge> · Joined {formatDate(user.createdAt)}</span>
                <UserActions userId={user.id} status={user.status} isSelf={viewer?.id === user.id} />
              </div>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card md:block">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Account</th>
                <th scope="col" className="px-4 py-3 font-medium">Role</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Joined</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.items.map((user) => (
                <tr key={user.id} className="align-top transition-colors hover:bg-secondary/25">
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{user.role.toLowerCase()}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.status === "ACTIVE" ? "success" : "secondary"}>
                      {user.status.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <UserActions
                      userId={user.id}
                      status={user.status}
                      isSelf={viewer?.id === user.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {users.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {users.page} of {users.pages} · {users.total} account{users.total === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            {users.page > 1 && (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href={`/admin/users?page=${users.page - 1}${status ? `&status=${status}` : ""}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                  Previous
                </Link>
              </Button>
            )}
            {users.page < users.pages && (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href={`/admin/users?page=${users.page + 1}${status ? `&status=${status}` : ""}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
