"use client";

import { cn } from "@workspace/ui/lib/utils";
import {
  COMPANY_STATUS_NAMES,
  CompanyStatusEnum,
  type Company,
} from "@workspace/shared/types/company";

/** Derived Company Status: Prospecto (amber) or Cliente (emerald). */
export function CompanyStatusBadge({
  status,
  className,
}: {
  status: CompanyStatusEnum;
  className?: string;
}) {
  return (
    <span
      title={
        status === CompanyStatusEnum.CLIENT
          ? "Tiene una oportunidad ganada o alguna vacante."
          : "Todavía sin oportunidades ganadas ni vacantes."
      }
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold",
        status === CompanyStatusEnum.CLIENT
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700",
        className,
      )}
    >
      {COMPANY_STATUS_NAMES[status]}
    </span>
  );
}
