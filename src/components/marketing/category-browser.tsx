"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORY_GROUPS } from "@/lib/marketing-content";

type ListingType = "RENT" | "SALE";

/**
 * Rent / buy browser for the landing page.
 *
 * One mode at a time, one row of cards — so "Apartments" and "Houses" never appear
 * twice side by side looking identical. The active mode is stated three times: in the
 * toggle, in the group line, and on every card.
 */
export function CategoryBrowser({ counts }: { counts: Record<ListingType, number> }) {
  const [listingType, setListingType] = useState<ListingType>("RENT");

  const group = CATEGORY_GROUPS.find((g) => g.listingType === listingType) ?? CATEGORY_GROUPS[0];
  const caption = listingType === "RENT" ? "For rent" : "For sale";
  const noun = listingType === "RENT" ? "sample rentals" : "sample sales";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div
          role="group"
          aria-label="Choose whether you want to rent or buy"
          className="inline-flex rounded-full border border-border bg-card p-1"
        >
          {CATEGORY_GROUPS.map((candidate) => {
            const isActive = candidate.listingType === listingType;
            return (
              <button
                key={candidate.listingType}
                type="button"
                aria-pressed={isActive}
                onClick={() => setListingType(candidate.listingType)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {candidate.title}
              </button>
            );
          })}
        </div>

        <Link
          href={`/listings?listingType=${listingType}`}
          className="inline-flex items-center gap-1 text-sm font-medium hover:text-accent"
        >
          See all {group.title.toLowerCase()} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <group.icon className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <p className="text-sm text-muted-foreground">
          {group.blurb} · {counts[listingType]} {noun}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {group.cards.map((category) => {
          const href = category.category
            ? `/listings?listingType=${listingType}&category=${category.category}`
            : `/listings?listingType=${listingType}&propertyType=${category.type}`;
          return (
            <Link
              key={`${listingType}-${category.label}`}
              href={href}
              aria-label={`${category.label} ${caption.toLowerCase()}`}
              className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="flex h-full flex-col items-center justify-center text-center">
                <category.icon className="mb-2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm font-medium">{category.label}</span>
                <span className="mt-1.5 text-[11px] font-medium text-muted-foreground">
                  {caption}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
