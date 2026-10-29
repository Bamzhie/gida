"use client";

import { useRouter } from "next/navigation";
import { useState, type ComponentProps } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  label?: string;
};

export function SignOutButton({
  className,
  variant = "ghost",
  size = "default",
  label = "Sign out",
}: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.dispatchEvent(new Event("gida:auth-changed"));
      setPending(false);
      router.push("/");
      router.refresh();
    }
  }

  return (
    <Button className={className} variant={variant} size={size} onClick={handleSignOut} disabled={pending}>
      <LogOut className="h-4 w-4" />
      {label}
    </Button>
  );
}
