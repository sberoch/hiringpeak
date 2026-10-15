"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import {
  COMPANY_STATUS_NAMES,
  CompanyStatusEnum,
  type Company,
} from "@workspace/shared/types/company";

import { COMPANIES_API_KEY, setCompanyAccountOwner } from "@/lib/api/company";
import { OwnerAvatar } from "@/components/tasks/_shared";
import {
  apiErrorMessage,
  useCommercialAccess,
  useCommercialUsers,
} from "@/components/opportunities/opportunity-ui";

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

/**
 * The Company's Account Owner ("Responsable de cuenta"). Read-only for
 * everyone who sees the Company; with `CRM_MANAGE` it opens a picker of the
 * users with commercial access.
 */
export function AccountOwnerControl({
  company,
  size = "md",
}: {
  company: Pick<Company, "id" | "name" | "accountOwner">;
  size?: "sm" | "md";
}) {
  const { canManage } = useCommercialAccess();
  const owner = company.accountOwner;

  const display = (
    <span className="inline-flex min-w-0 items-center gap-2">
      {owner ? (
        <OwnerAvatar name={owner.name} size="sm" />
      ) : (
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-brand-border text-muted-brand">
          <UserRound className="h-3 w-3" />
        </span>
      )}
      <span
        className={cn(
          "truncate font-medium",
          owner ? "text-ink" : "text-muted-brand",
          size === "sm" ? "text-xs" : "text-sm",
        )}
      >
        {owner ? owner.name : "Sin responsable"}
      </span>
    </span>
  );

  if (!canManage) return display;
  return <AccountOwnerPicker company={company}>{display}</AccountOwnerPicker>;
}

function AccountOwnerPicker({
  company,
  children,
}: {
  company: Pick<Company, "id" | "name" | "accountOwner">;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const { data: commercialUsers = [] } = useCommercialUsers();
  const owner = company.accountOwner;

  const mutation = useMutation({
    mutationFn: (accountOwnerId: number | null) =>
      setCompanyAccountOwner(company.id, accountOwnerId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [COMPANIES_API_KEY] });
      toast.success(
        updated.accountOwner
          ? `${updated.accountOwner.name} es responsable de ${company.name}`
          : `${company.name} quedó sin responsable de cuenta`,
      );
    },
    onError: (err) =>
      toast.error(
        apiErrorMessage(err, "No se pudo cambiar el responsable de cuenta."),
      ),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={mutation.isPending}
          className="-mx-1.5 inline-flex min-w-0 items-center gap-1 rounded-lg px-1.5 py-0.5 transition-colors hover:bg-brand-border-light"
        >
          {children}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-brand" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-brand">
          Responsable de cuenta (solo usuarios con acceso comercial)
        </DropdownMenuLabel>
        {commercialUsers.map((user) => (
          <DropdownMenuItem
            key={user.id}
            className="cursor-pointer"
            onClick={() => {
              if (user.id !== owner?.id) mutation.mutate(user.id);
            }}
          >
            <Check
              className={cn(
                "h-4 w-4",
                user.id === owner?.id ? "opacity-100" : "opacity-0",
              )}
            />
            {user.name}
          </DropdownMenuItem>
        ))}
        {owner && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-slate-brand"
              onClick={() => mutation.mutate(null)}
            >
              Quitar responsable
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
