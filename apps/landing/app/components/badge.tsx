import * as React from "react";
import { Badge as UIBadge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";

function Badge({
  className,
  ...props
}: React.ComponentProps<typeof UIBadge>) {
  return (
    <UIBadge
      variant="outline"
      className={cn(
        "rounded-full border border-accent/10 bg-gradient-to-br from-accent/[0.08] to-accent-dark/[0.06] px-4 py-2 text-xs font-semibold text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
