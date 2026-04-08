import type { LucideIcon } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";

interface PageHeadingProps {
  icon: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

export function PageHeading({
  icon: Icon,
  title,
  description,
  className,
}: PageHeadingProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description && (
          <p className="text-sm text-slate-brand leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
