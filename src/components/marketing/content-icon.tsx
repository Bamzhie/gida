import { createElement } from "react";
import { iconFor } from "@/lib/content-icons";

export function ContentIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = iconFor(name);
  if (!Icon) return null;
  return createElement(Icon, { className, "aria-hidden": "true" });
}
