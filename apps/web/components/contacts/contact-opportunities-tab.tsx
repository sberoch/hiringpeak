"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Handshake } from "lucide-react";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import type { NetworkContact } from "@workspace/shared/types/contact";

import { getOpportunities, OPPORTUNITY_API_KEY } from "@/lib/api/opportunity";
import { formatMoney } from "@/lib/utils";
import { opportunityHref } from "@/components/opportunities/opportunity-format";
import { StageBadge } from "@/components/opportunities/stage-badge";

/** The Opportunities the Contact is part of, at any Company. */
export function ContactOpportunitiesTab({
  contact,
  canCreate,
  onCreate,
}: {
  contact: NetworkContact;
  canCreate: boolean;
  onCreate: () => void;
}) {
  const firstName = contact.name.split(" ")[0];
  const { data: opportunities, isLoading } = useQuery({
    queryKey: [OPPORTUNITY_API_KEY, { contactId: contact.id }],
    queryFn: () => getOpportunities({ contactId: contact.id }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-brand">
          Oportunidades en las que figura {firstName}, en cualquier empresa.
        </p>
        {canCreate && (
          <Button size="sm" variant="brand" onClick={onCreate}>
            <Handshake className="h-4 w-4" />
            Crear oportunidad
          </Button>
        )}
      </div>
      <div className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
        {isLoading ? (
          <div className="m-5 h-10 animate-pulse rounded-xl bg-brand-border-light" />
        ) : !opportunities?.length ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-ink">
              No figura en ninguna oportunidad.
            </p>
            <p className="mt-1 text-xs text-slate-brand">
              {contact.company
                ? `Si aparece una conversación comercial real, creala en ${contact.company.name}.`
                : "Si aparece algo concreto, creala y elegí la empresa: pasa a ser la suya."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-xs font-semibold text-slate-brand">
                <th className="px-5 py-3">Oportunidad</th>
                <th className="px-3 py-3">Empresa</th>
                <th className="px-3 py-3">Etapa</th>
                <th className="px-3 py-3 text-right">Fee estimado</th>
                <th className="px-5 py-3">Responsable</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opportunity) => {
                const elsewhere = opportunity.companyId !== contact.company?.id;
                return (
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
                      <Link
                        href={`/companies/${opportunity.company.id}`}
                        className={cn(
                          "hover:text-electric",
                          elsewhere ? "text-slate-brand" : "text-ink",
                        )}
                      >
                        {opportunity.company.name}
                      </Link>
                      {elsewhere && (
                        <p className="text-[11px] text-muted-brand">
                          empresa anterior
                        </p>
                      )}
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
                    <td className="px-5 py-4 text-slate-brand">
                      {opportunity.owner.name}
                    </td>
                    <td className="pr-4">
                      <ChevronRight className="h-4 w-4 text-muted-brand" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
