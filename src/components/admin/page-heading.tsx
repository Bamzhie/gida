import type { ReactNode } from "react";

type AdminPageHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function AdminPageHeading({ eyebrow, title, description, action }: AdminPageHeadingProps) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="max-w-3xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
