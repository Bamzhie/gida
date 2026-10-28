"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SearchMode = "rent" | "buy" | "shortlet";

const SEARCH_MODES: { value: SearchMode; label: string; prompt: string }[] = [
  { value: "rent", label: "Rent", prompt: "Search properties to rent" },
  { value: "buy", label: "Buy", prompt: "Search properties to buy" },
  { value: "shortlet", label: "Short-let", prompt: "Find a short-let stay" },
];

export function HeroSearch() {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>("rent");
  const [location, setLocation] = useState("");
  const selectedMode = SEARCH_MODES.find((item) => item.value === mode)!;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("city", location.trim());
    if (mode === "rent") params.set("listingType", "RENT");
    if (mode === "buy") params.set("listingType", "SALE");
    if (mode === "shortlet") {
      params.set("listingType", "RENT");
      params.set("category", "SHORTLET");
    }
    const suffix = params.toString();
    router.push(suffix ? `/listings?${suffix}` : "/listings");
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="max-w-2xl overflow-hidden rounded-3xl border border-primary/15 bg-primary text-primary-foreground shadow-[0_24px_70px_-28px_rgba(21,20,15,0.75)]">
        <fieldset className="border-b border-primary-foreground/20 px-4 sm:px-5">
          <legend className="sr-only">Property search type</legend>
          <div className="flex">
            {SEARCH_MODES.map((item) => (
              <label key={item.value} className="group relative flex cursor-pointer items-center px-3.5 py-2.5 text-sm font-semibold">
                <input
                  type="radio"
                  name="search-mode"
                  value={item.value}
                  checked={mode === item.value}
                  onChange={() => setMode(item.value)}
                  className="peer sr-only"
                />
                <span className={cn("transition-colors", mode === item.value ? "text-primary-foreground" : "text-primary-foreground/65 group-hover:text-primary-foreground")}>
                  {item.label}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-primary-foreground transition-opacity peer-focus-visible:opacity-100",
                    mode === item.value ? "opacity-100" : "opacity-0"
                  )}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div className="p-4 sm:px-5 sm:py-4">
          <label htmlFor="hero-location" className="mb-2.5 block text-sm font-semibold">{selectedMode.prompt}</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="hero-location"
                type="text"
                autoComplete="off"
                placeholder="Enter a city, area, or landmark"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent sm:text-base"
              />
            </div>
            <Button type="submit" size="lg" className="h-11 rounded-xl bg-accent px-6 font-semibold text-accent-foreground hover:bg-accent/90 sm:min-w-[150px]">
              Search
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
