import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MarketingPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function MarketingPage({ eyebrow, title, description, children }: MarketingPageProps) {
  return (
    <div className="min-h-[calc(100vh-5rem)]">
      <header className="border-b border-border bg-secondary/20">
        <div className="container mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-10 sm:py-20">
          <Badge variant="secondary" className="mb-5 gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {eyebrow}
          </Badge>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">{description}</p>
            </div>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" /> Back home
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10">{children}</div>
    </div>
  );
}

export function MarketingSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border py-10 last:border-b-0 sm:py-14">
      {eyebrow && <p className="mb-3 text-sm font-medium text-accent">{eyebrow}</p>}
      <h2 className="font-heading text-2xl font-semibold sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 max-w-3xl text-muted-foreground">{description}</p>}
      <div className="mt-7">{children}</div>
    </section>
  );
}

export function MarketingLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent">
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
