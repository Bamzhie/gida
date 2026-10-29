import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Your account | Gida",
    template: "%s | Gida",
  },
  description:
    "Sign in to Gida or create an account to save homes and manage your enquiries.",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
