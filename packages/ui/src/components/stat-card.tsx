import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  className?: string;
  iconClassName?: string;
  monthlyVariation?: number;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  className,
  iconClassName,
  monthlyVariation,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-brand-border bg-surface p-6 h-fit transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-electric/20 hover:shadow-[0_12px_32px_-8px_rgba(0,102,255,0.1)]",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)] flex-shrink-0",
            iconClassName
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="text-sm text-slate-brand">{label}</div>
          <div className="text-2xl font-bold tracking-tight text-ink">{value}</div>
          {monthlyVariation !== undefined && (
            <div className="text-sm font-medium text-slate-brand flex items-center gap-1">
              <span
                className={cn(
                  "font-semibold flex items-center gap-0.5 text-xs",
                  monthlyVariation >= 0 ? "text-emerald-600" : "text-red-500"
                )}
              >
                {monthlyVariation >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {monthlyVariation >= 0 ? "+" : ""}
                {monthlyVariation}
              </span>
              <span className="font-normal text-muted-brand text-xs">este mes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
