import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Gida marketplace preview",
    template: "%s | Gida",
  },
  description:
    "Explore a Lagos-first property marketplace preview with illustrative listings, local search, saved properties and enquiry flows.",
};

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return children;
}
