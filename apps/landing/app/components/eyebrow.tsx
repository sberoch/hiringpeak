import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

/**
 * The small "Pipeline Visual" / "Perfiles Ejecutivos" label: a short accent
 * line followed by uppercase tracked text. Used as the eyebrow above section
 * and card headings across the landing page.
 */
function Eyebrow({
  children,
  className,
  accentClassName = "text-accent",
  lineClassName = "from-accent",
}: {
  children: React.ReactNode;
  className?: string;
  /** Text color, e.g. "text-accent-dark". */
  accentClassName?: string;
  /** Gradient start color for the line, e.g. "from-accent-dark". */
  lineClassName?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-wide",
        accentClassName,
        className,
      )}
    >
      <span
        className={cn("h-px w-10 bg-gradient-to-r to-transparent", lineClassName)}
      />
      {children}
    </div>
  );
}

export { Eyebrow };
