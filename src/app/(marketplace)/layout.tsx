import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Gida marketplace",
    template: "%s | Gida",
  },
  description:
    "Search Lagos homes for rent or sale, filter by area and budget, and compare the disclosed costs on every listing.",
};

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return children;
}
