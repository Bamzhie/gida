import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Dashboard preview",
  description: "The Gida dashboard will become available when the backend and authentication phase is connected.",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
