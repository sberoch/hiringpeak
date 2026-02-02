import * as React from "react";
import { Info } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";

const calloutVariants = {
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  warning:
    "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  success:
    "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
  error:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
};

interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof calloutVariants;
  icon?: React.ComponentType<{ className?: string }>;
}

const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  ({ className, variant = "info", icon: Icon = Info, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border p-4 flex items-start gap-3",
        calloutVariants[variant],
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
    </div>
  )
);
Callout.displayName = "Callout";

export { Callout, calloutVariants };
