"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RevealPhone({
  phone,
  className,
  revealLabel = "Show phone number",
  unavailableLabel = "Phone unavailable",
}: {
  phone?: string | null;
  className?: string;
  revealLabel?: string;
  unavailableLabel?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  if (!phone) {
    return <Button type="button" variant="outline" disabled className={className}><Phone />{unavailableLabel}</Button>;
  }

  const dialable = phone.replace(/[^+\d]/g, "");
  if (revealed) {
    return (
      <Button asChild className={className}>
        <a href={`tel:${dialable}`}><Phone />Call {phone}</a>
      </Button>
    );
  }

  return (
    <Button type="button" onClick={() => setRevealed(true)} className={className}>
      <Phone />{revealLabel}
    </Button>
  );
}
