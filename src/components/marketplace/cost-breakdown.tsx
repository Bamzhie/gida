import { formatPrice } from "@/lib/utils";

const ROWS: { label: string; amount: number; confirmed?: boolean }[] = [
  { label: "Rent, per year", amount: 3_500_000 },
  { label: "Agency fee, 10 percent", amount: 350_000, confirmed: true },
  { label: "Legal fee, 5 percent", amount: 175_000, confirmed: true },
  { label: "Caution deposit", amount: 300_000 },
  { label: "Service charge, per year", amount: 250_000, confirmed: true },
];

const TOTAL = ROWS.reduce((sum, r) => sum + r.amount, 0);

export function CostBreakdown() {
  return (
    <div className="rounded-2xl bg-card border border-border p-6 sm:p-7 shadow-sm">
      <div className="flex items-baseline justify-between border-b border-dashed border-border pb-3 mb-3">
        <span className="font-heading font-semibold text-lg">2 bedroom flat, Lekki Phase 1</span>
        <span className="text-xs text-muted-foreground">2 bed, 2 bath</span>
      </div>

      {ROWS.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between border-b border-border py-2.5 text-sm"
        >
          <span className="text-muted-foreground">{row.label}</span>
          <span className="font-medium">
            {formatPrice(row.amount)}
            {row.confirmed && (
              <span className="ml-2 text-xs font-normal text-accent">confirmed</span>
            )}
          </span>
        </div>
      ))}

      <div className="flex items-center justify-between border-t-2 border-foreground pt-3 mt-1 font-heading font-semibold text-lg">
        <span>Total package</span>
        <span>{formatPrice(TOTAL)}</span>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        This is a worked example, using the kind of figures an advertiser would give us on a real
        listing. We do not add a fee that nobody told us about.
      </p>
    </div>
  );
}
