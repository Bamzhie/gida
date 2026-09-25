import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Account preview | Gida",
    template: "%s | Gida",
  },
  description:
    "Preview the Gida account and listing flows. Authentication and server persistence are planned for a later backend phase.",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
