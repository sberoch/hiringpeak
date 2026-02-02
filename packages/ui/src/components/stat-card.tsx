import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";

import { Card } from "@workspace/ui/components/card";
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
    <Card
      className={cn(
        "bg-white hover:bg-green-600/5 p-6 shadow-none rounded-xl transition-colors h-fit",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-16 h-16 rounded-full bg-green-600/10 flex items-center justify-center flex-shrink-0",
            iconClassName
          )}
        >
          <Icon size={24} className="text-green-600" />
        </div>

        <div className="flex flex-col">
          <div className="text-black/50 text-sm">{label}</div>
          <div className="text-lg font-bold mt-1">{value}</div>
          {monthlyVariation !== undefined && (
            <div className="text-sm font-medium text-black flex items-center gap-1">
              <span
                className={cn(
                  "font-bold flex items-center gap-1 text-sm",
                  monthlyVariation >= 0 ? "text-green-600" : "text-red-500"
                )}
              >
                {monthlyVariation >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {monthlyVariation >= 0 ? "+" : ""}
                {monthlyVariation}
              </span>
              <span className="font-normal text-black text-sm"> este mes</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
