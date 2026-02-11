"use client";

import { Check, X } from "lucide-react";

import {
  getPasswordRequirementResults,
  PASSWORD_REQUIREMENT_LABELS,
} from "@workspace/shared/lib/password.schema";
import { cn } from "@workspace/ui/lib/utils";

const REQUIREMENT_KEYS = [
  "length",
  "upper",
  "lower",
  "number",
  "special",
] as const;

export interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

export function PasswordRequirements({
  password,
  className,
}: PasswordRequirementsProps) {
  const results = getPasswordRequirementResults(password);

  return (
    <ul
      className={cn("grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm", className)}
      role="list"
      aria-label="Password requirements"
    >
      {REQUIREMENT_KEYS.map((key) => {
        const met = results[key];
        const label = PASSWORD_REQUIREMENT_LABELS[key];
        return (
          <li
            key={key}
            className="flex items-center gap-2"
            aria-label={label}
          >
            {met ? (
              <Check className="h-4 w-4 shrink-0 text-green-600" aria-hidden />
            ) : (
              <X className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span
              className={cn(
                met ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
