"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";

const SearchMap = dynamic(
  () => import("@/components/map/search-map").then((m) => m.SearchMap),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-border bg-card h-[480px] lg:h-[600px] flex items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  }
);

function MapSearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={query ? `/listings?${query}` : "/listings"}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to listings
      </Link>
      <SearchMap />
    </div>
  );
}

export default function MapSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 text-muted-foreground">
          Loading map…
        </div>
      }
    >
      <MapSearchContent />
    </Suspense>
  );
}
