import Link from "next/link";
import { ArrowRight, House } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Page not found | Gida",
  description: "We couldn't find that page. Browse Gida listings or return home.",
};

export default function NotFound() {
  return (
    <section className="container mx-auto flex min-h-[60vh] items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        <div className="relative flex min-h-52 items-center justify-center overflow-hidden rounded-[2rem] bg-secondary/70 sm:min-h-64 md:min-h-80">
          <span
            aria-hidden="true"
            className="select-none font-heading text-[9rem] font-semibold leading-none tracking-[-0.1em] text-accent/15 sm:text-[12rem] md:text-[14rem]"
          >
            404
          </span>
          <div className="absolute grid size-16 place-items-center rounded-2xl border border-border bg-background text-accent shadow-sm sm:size-20">
            <House className="size-8 sm:size-9" strokeWidth={1.7} aria-hidden="true" />
          </div>
        </div>

        <div className="max-w-xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            Page not found
          </p>
          <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            This address doesn&apos;t lead to a Gida page.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            The page may have moved, or the link may be out of date. Let&apos;s get you back to finding a place.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/listings">
                Browse listings <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
