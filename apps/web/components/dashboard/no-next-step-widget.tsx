"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CircleAlert, Handshake } from "lucide-react";
import Link from "next/link";

import type { OpportunityFilters } from "@workspace/shared/types/opportunity";

import { getOpportunities, OPPORTUNITY_API_KEY } from "@/lib/api/opportunity";

const FILTERS: OpportunityFilters = { noNextStep: true };
const SHOWN = 5;

/** «Oportunidades sin próximo paso»: open Opportunities with No Next Step. */
export function NoNextStepWidget() {
  const { data, isLoading } = useQuery({
    queryKey: [OPPORTUNITY_API_KEY, FILTERS],
    queryFn: () => getOpportunities(FILTERS),
  });
  const opportunities = data ?? [];

  return (
    <div className="rounded-2xl border border-brand-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
            <CircleAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-ink">
              Oportunidades sin próximo paso
            </h3>
            {opportunities.length > 0 && (
              <p className="text-xs text-slate-brand">
                {opportunities.length} sin tarea abierta
              </p>
            )}
          </div>
        </div>
        <Link
          href="/opportunities"
          className="flex items-center gap-1 text-xs font-semibold text-electric hover:text-electric-light transition-colors group"
        >
          Ver todas
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isLoading ? (
        <p className="px-6 py-10 text-center text-sm text-muted-brand">
          Cargando…
        </p>
      ) : opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-brand">
          <Handshake className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">Todas tienen un próximo paso</p>
        </div>
      ) : (
        <div className="divide-y divide-brand-border-light">
          {opportunities.slice(0, SHOWN).map((opportunity) => (
            <Link
              key={opportunity.id}
              href={`/opportunities/${opportunity.id}`}
              className="flex flex-col gap-0.5 px-5 py-3 transition-colors hover:bg-electric/[0.03]"
            >
              <span className="truncate text-sm font-semibold text-ink">
                {opportunity.title}
              </span>
              <span className="truncate text-xs text-slate-brand">
                {opportunity.company.name} · {opportunity.stage.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
