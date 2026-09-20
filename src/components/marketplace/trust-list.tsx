import { Check, Minus } from "lucide-react";

const ITEMS: { label: string; when: string; done: boolean }[] = [
  { label: "We checked who the advertiser actually is", when: "Verified 3 June 2026", done: true },
  { label: "We checked their agency is registered", when: "Verified 3 June 2026", done: true },
  { label: "Someone from our team has seen the property", when: "Visited 20 August 2026", done: true },
  { label: "We confirmed the price with the advertiser", when: "Confirmed 12 September 2026", done: true },
  { label: "We confirmed it is still available", when: "Not yet confirmed", done: false },
];

export function TrustList() {
  return (
    <div className="border-t border-border">
      {ITEMS.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[20px_1fr_auto] items-baseline gap-4 border-b border-border py-4"
        >
          {item.done ? (
            <Check className="h-4 w-4 text-accent" />
          ) : (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm sm:text-base">{item.label}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{item.when}</span>
        </div>
      ))}
    </div>
  );
}
