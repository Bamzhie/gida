"use client";

import dynamic from "next/dynamic";

type Props = { latitude: number; longitude: number; label: string };

const ListingLocationMapInner = dynamic(
  () => import("@/components/marketplace/listing-location-map-inner").then((module) => module.ListingLocationMapInner),
  { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-xl bg-secondary" aria-label="Loading map" /> }
);

export function ListingLocationMap(props: Props) {
  return <ListingLocationMapInner {...props} />;
}
