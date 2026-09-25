import { Check, Minus } from "lucide-react";

const ITEMS: { label: string; when: string; done: boolean }[] = [
  { label: "Advertiser verification example", when: "Illustrative date", done: true },
  { label: "Agency registration example", when: "Illustrative date", done: true },
  { label: "Property visit example", when: "Illustrative date", done: true },
  { label: "Price confirmation example", when: "Illustrative date", done: true },
  { label: "Availability confirmation", when: "Preview data", done: false },
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
