import { Check, Minus } from "lucide-react";
import type { ContentItemDto } from "@/lib/content";

export function TrustList({ items }: { items: ContentItemDto[] }) {
  return (
    <div className="border-t border-border">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[20px_1fr_auto] items-baseline gap-4 border-b border-border py-4">
          {item.payload.connected === true ? (
            <Check className="h-4 w-4 text-accent" />
          ) : (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm sm:text-base">{item.label}</span>
          <span className="text-xs text-muted-foreground sm:whitespace-nowrap">{item.body ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}
