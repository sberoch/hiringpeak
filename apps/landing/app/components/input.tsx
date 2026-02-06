import * as React from "react";
import { Input as UIInput } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";

function Input({
  className,
  ...props
}: React.ComponentProps<typeof UIInput>) {
  return (
    <UIInput
      className={cn(
        "rounded-xl bg-canvas border-border px-4 py-3.5 text-ink placeholder:text-muted transition-all duration-300 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10 focus-visible:ring-accent/10",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
