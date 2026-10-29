"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProblemDetail } from "@/lib/api-types";

function messageFor(problem: ProblemDetail | null): string {
  if (problem?.errors) {
    const first = Object.values(problem.errors)[0];
    if (first) return first;
  }
  return problem?.detail ?? "Registration failed. Please check your details and try again.";
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      phone: formData.get("phone") as string || undefined,
      role: (formData.get("role") as string) || "USER",
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const problem = (await res.json().catch(() => null)) as ProblemDetail | null;
        toast.error(messageFor(problem));
        return;
      }

      toast.success("Account created. Sign in to continue.");
      router.push("/login");
    } catch {
      toast.error("Could not reach the registration service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Gida</span>
          </Link>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Create your account to save listings and contact agents.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+234 800 000 0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Min. 8 characters" minLength={8} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">I am a</Label>
              <Select name="role" defaultValue="USER"><SelectTrigger id="role"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USER">Buyer / Renter</SelectItem><SelectItem value="AGENT">Agent / Landlord</SelectItem></SelectContent></Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By creating an account you agree to the{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">terms of service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">privacy policy</Link>.
          </p>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
