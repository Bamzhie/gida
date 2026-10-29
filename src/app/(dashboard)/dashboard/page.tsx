import Link from "next/link";
import { Building2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

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
    </div>
  );
}
