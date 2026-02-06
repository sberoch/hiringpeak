import * as React from "react";
import {
  Card as UICard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@workspace/ui/components/card";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@workspace/ui/lib/utils";

const landingCardVariants = cva("", {
  variants: {
    variant: {
      default: "",
      glass: "glass-card",
      glassStrong: "glass-card-strong border-border/60",
      feature: "feature-card glass-card-strong border-border/50",
      illustration: "illustration-card border border-border/50 card-hover",
      testimonial: "testimonial-card glass-card-strong",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Card({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof UICard> &
  VariantProps<typeof landingCardVariants>) {
  return (
    <UICard
      className={cn(landingCardVariants({ variant }), className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
  landingCardVariants,
};
