import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your saved listings and account at a glance.",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
