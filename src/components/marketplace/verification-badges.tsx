import { BadgeCheck, Building2, MapPin, Tag } from "lucide-react";
import type { VerificationSummary } from "@/lib/api-types";
import { hasAnyVerification } from "@/lib/verification";

type VerificationBadgesProps = {
  summary: VerificationSummary | null;
  className?: string;
};

/**
 * Public trust signals. Only verified dimensions get a badge — an unverified
 * dimension renders nothing at all, because a "not verified" chip on every
 * listing would be noise that punishes honest advertisers for the platform's
 * own coverage gaps. The summary carries no timestamp, so no date is shown.
 */
export function VerificationBadges({ summary, className }: VerificationBadgesProps) {
  if (!hasAnyVerification(summary)) return null;

  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      {summary.advertiserVerified && (
        <BadgeCheck className="h-4 w-4 text-accent" aria-hidden="true" />
      )}
      {summary.advertiserVerified && <Chip label="Verified advertiser" />}
      {summary.propertyVerified && <Chip icon={<Building2 className="h-3.5 w-3.5" />} label="Property checked" />}
      {summary.locationVerified && <Chip icon={<MapPin className="h-3.5 w-3.5" />} label="Location checked" />}
      {summary.priceVerified && <Chip icon={<Tag className="h-3.5 w-3.5" />} label="Price confirmed" />}
    </div>
  );
}

function Chip({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-medium text-foreground">
      {icon}
      {label}
    </span>
  );
}
