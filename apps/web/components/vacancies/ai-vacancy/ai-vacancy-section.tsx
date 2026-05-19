"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";

export const fieldClassName =
  "rounded-xl border-brand-border bg-canvas focus:border-electric focus:ring-electric/10 placeholder:text-muted-brand";

interface AiVacancySectionProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AiVacancySection({
  icon: Icon,
  title,
  description,
  headerExtra,
  children,
  className,
  contentClassName,
}: AiVacancySectionProps) {
  return (
    <section
      className={cn(
        "overflow-hidden border-b border-brand-border bg-surface last:border-b-0",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-electric/10 text-electric">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold tracking-tight text-ink">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-sm text-slate-brand">{description}</p>
            ) : null}
          </div>
        </div>
        {headerExtra}
      </header>
      <div className={cn("px-5 py-4", contentClassName)}>{children}</div>
    </section>
  );
}
