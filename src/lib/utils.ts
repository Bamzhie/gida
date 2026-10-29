import { type ClassValue, clsx } from "clsx";
import type { Availability, ListingType, PricePeriod } from "@/lib/api-types";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatPricePeriod(property: {
  listingType: ListingType;
  pricePeriod?: PricePeriod | null;
}): string {
  if (property.listingType === "SALE") return "asking price";
  const labels: Record<PricePeriod, string> = {
    YEAR: "/year",
    MONTH: "/month",
    NIGHT: "/night",
    STAY: "/stay",
  };
  return property.pricePeriod ? labels[property.pricePeriod] : "period not specified";
}

export function formatListingStatus(status: Availability): string {
  return { AVAILABLE: "Available", PENDING: "Pending", SOLD: "Sold", RENTED: "Rented" }[status];
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
