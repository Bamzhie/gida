import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  COST_LABELS,
  disclosedTotal,
  listingPriceLabel,
  type ListingDetailModel,
} from "@/lib/listing-view";

export function CostBreakdown({ listing }: { listing: ListingDetailModel }) {
  const beds = listing.bedrooms === null ? null : `${listing.bedrooms} bed`;
  const baths = listing.bathrooms === null ? null : `${listing.bathrooms} bath`;
  const spec = [beds, baths].filter(Boolean).join(", ");
  const total = disclosedTotal(listing);

  return (
    <div className="rounded-2xl bg-card border border-border p-6 sm:p-7 shadow-sm">
      <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border pb-3 mb-3">
        <Link href={`/listings/${listing.id}`} className="font-heading font-semibold text-lg hover:text-accent">
          {listing.title}
        </Link>
        <span className="text-xs text-muted-foreground">{spec}</span>
      </div>

      <div className="flex items-center justify-between border-b border-border py-2.5 text-sm">
        <span className="text-muted-foreground">
          {listing.listingType === "RENT" ? "Rent" : "Asking price"}
        </span>
        <span className="font-medium">{listingPriceLabel(listing)}</span>
      </div>

      {listing.costs.map((cost) => (
        <div key={`${cost.type}-${cost.amount}`} className="flex items-center justify-between border-b border-border py-2.5 text-sm">
          <span className="text-muted-foreground">
            {COST_LABELS[cost.type]}
            {cost.note && <span className="block text-xs">{cost.note}</span>}
          </span>
          <span className="font-medium">{formatPrice(cost.amount)}</span>
        </div>
      ))}

      <div className="flex items-center justify-between border-t-2 border-foreground pt-3 mt-1 font-heading font-semibold text-lg">
        <span>Total disclosed</span>
        <span>{formatPrice(total)}</span>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {listing.confirmedAt
          ? `Last confirmed ${formatDate(listing.confirmedAt)} by ${listing.advertiser.name}.`
          : `Not yet confirmed by ${listing.advertiser.name}.`}{" "}
        Only the costs an advertiser has disclosed appear here.
      </p>
    </div>
  );
}
