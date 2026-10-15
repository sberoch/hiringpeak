"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";

import { cn } from "@workspace/ui/lib/utils";
import type { Interaction } from "@workspace/shared/types/interaction";

import {
  formatInteractionDay,
  interactionMeta,
  sinceLabel,
} from "@/components/interactions/interaction-format";
import { useDeleteInteraction } from "@/components/interactions/interaction-mutations";

/**
 * One Interaction: type, when, who recorded it, the summary, the Contacts
 * (people who have since moved show where they are today, as a hint) and the
 * Opportunity it was tied to.
 */
export function InteractionEntry({
  interaction,
  canManage,
  showOpportunity = true,
  showCompany = false,
  className,
}: {
  interaction: Interaction;
  canManage: boolean;
  showOpportunity?: boolean;
  showCompany?: boolean;
  className?: string;
}) {
  const remove = useDeleteInteraction();
  const meta = interactionMeta(interaction.type);
  const Icon = meta.icon;
  const by = interaction.createdByUser?.name.split(" ")[0];
  return (
    <div className={cn("group flex gap-3", className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-electric/10 text-electric">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="font-semibold text-ink">{meta.label}</span>
          <span
            className="text-slate-brand"
            title={sinceLabel(interaction.date)}
          >
            {formatInteractionDay(interaction.date)}
          </span>
          {showCompany && (
            <span className="text-muted-brand">
              · {interaction.company?.name ?? "Sin empresa"}
            </span>
          )}
          {by && <span className="text-muted-brand">· registró {by}</span>}
          {canManage && (
            <button
              type="button"
              aria-label="Eliminar interacción"
              className="ml-auto text-muted-brand opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm("¿Eliminar esta interacción?")) {
                  remove.mutate(interaction.id);
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">
          {interaction.summary}
        </p>
        {(interaction.contacts.length > 0 ||
          (showOpportunity && interaction.opportunity)) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {interaction.contacts.map((c) => {
              // People who moved still show here; where they are today is a hint, not a rewrite.
              const movedTo =
                c.companyId !== interaction.companyId
                  ? (c.company?.name ?? "sin empresa")
                  : null;
              return (
                <Link
                  key={c.id}
                  href={`/contacts/${c.id}`}
                  title={movedTo ? `${c.name} · hoy en ${movedTo}` : c.role}
                  className="rounded-md bg-brand-border-light px-1.5 py-0.5 text-[11px] font-medium text-slate-brand hover:text-electric"
                >
                  {c.name}
                  {movedTo && (
                    <span className="font-normal text-muted-brand">
                      {" "}
                      · hoy en {movedTo}
                    </span>
                  )}
                </Link>
              );
            })}
            {showOpportunity && interaction.opportunity && (
              <Link
                href={`/opportunities/${interaction.opportunity.id}`}
                className="text-[11px] font-medium text-electric hover:underline"
              >
                ↳ {interaction.opportunity.title}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
