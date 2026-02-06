import * as React from "react";
import { Button as UIButton } from "@workspace/ui/components/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@workspace/ui/lib/utils";

const landingButtonVariants = cva(
  "rounded-xl font-semibold transition-all duration-200 focus-visible:ring-accent/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white hover:bg-accent-dark shadow-xs [&_svg]:size-5",
        secondary:
          "bg-surface border border-border text-ink hover:bg-canvas hover:border-accent",
      },
      size: {
        default: "h-11 px-6 py-3 text-sm has-[>svg]:px-4",
        lg: "px-8 py-4 text-base has-[>svg]:px-5 [&_svg]:size-5",
        full: "w-full py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof UIButton> &
  VariantProps<typeof landingButtonVariants>) {
  return (
    <UIButton
      className={cn(landingButtonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, landingButtonVariants };
