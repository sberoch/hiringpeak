"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@workspace/ui/lib/utils";
import type { Company } from "@workspace/shared/types/company";

import { getOpportunities, OPPORTUNITY_API_KEY } from "@/lib/api/opportunity";
import { formatMoney } from "@/lib/utils";
import { NewOpportunityButton } from "../opportunities/new-opportunity-sheet";
import {
  formatDay,
  opportunityHref,
} from "@/components/opportunities/opportunity-format";
import { StageBadge } from "@/components/opportunities/stage-badge";

/** The Company's Opportunities, open first (commercial access only). */
export function CompanyOpportunitiesTab({ company }: { company: Company }) {
  const { data: opportunities, isLoading } = useQuery({
    queryKey: [OPPORTUNITY_API_KEY, { companyId: company.id }],
    queryFn: () => getOpportunities({ companyId: company.id }),
  });
  const sorted = [...(opportunities ?? [])].sort(
    (a, b) =>
      Number(a.stage.isWon || a.stage.isLost) -
      Number(b.stage.isWon || b.stage.isLost),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-brand">
          Posibles trabajos para {company.name}, abiertos primero.
        </p>
        <NewOpportunityButton companyId={company.id} size="sm" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
        {isLoading ? (
          <div className="m-5 h-10 animate-pulse rounded-xl bg-brand-border-light" />
        ) : sorted.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-ink">Sin oportunidades.</p>
            <p className="mt-1 text-xs text-slate-brand">
              {company.vacancyCount > 0
                ? "Cliente de antes de usar oportunidades: todavía no hay ninguna cargada."
                : "Creá una cuando haya una conversación comercial real."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-xs font-semibold text-slate-brand">
                <th className="px-5 py-3">Oportunidad</th>
                <th className="px-3 py-3">Etapa</th>
                <th className="px-3 py-3 text-right">Fee estimado</th>
                <th className="px-3 py-3">Responsable</th>
                <th className="px-5 py-3">Cierre</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((opportunity) => (
                <tr
                  key={opportunity.id}
                  className="group border-b border-brand-border-light last:border-0 hover:bg-canvas/60"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={opportunityHref(opportunity.id)}
                      className="font-semibold text-ink group-hover:text-electric"
                    >
                      {opportunity.title}
                    </Link>
                  </td>
                  <td className="px-3 py-4">
                    <StageBadge stage={opportunity.stage} />
                  </td>
                  <td
                    className={cn(
                      "px-3 py-4 text-right tabular-nums",
                      opportunity.estimatedFee == null
                        ? "italic text-muted-brand"
                        : "text-ink",
                    )}
                  >
                    {opportunity.estimatedFee == null
                      ? "Sin estimar"
                      : formatMoney(opportunity.estimatedFee)}
                  </td>
                  <td className="px-3 py-4 text-slate-brand">
                    {opportunity.owner.name}
                  </td>
                  <td className="px-5 py-4 text-slate-brand">
                    {opportunity.closeDate
                      ? formatDay(opportunity.closeDate)
                      : "—"}
                  </td>
                  <td className="pr-4">
                    <ChevronRight className="h-4 w-4 text-muted-brand" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
