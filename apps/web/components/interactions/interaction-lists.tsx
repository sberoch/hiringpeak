"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@workspace/ui/components/button";
import { LoadingSpinner } from "@workspace/ui/components/loading-spinner";
import { cn } from "@workspace/ui/lib/utils";
import type { InteractionType } from "@workspace/shared/enums";
import type { NetworkContact } from "@workspace/shared/types/contact";
import type {
  Interaction,
  InteractionFilters,
} from "@workspace/shared/types/interaction";
import type { Opportunity } from "@workspace/shared/types/opportunity";

import { useCommercialAccess } from "@/components/opportunities/opportunity-ui";
import { getInteractions, INTERACTION_API_KEY } from "@/lib/api/interaction";
import {
  CompanyInteractionDialog,
  ContactInteractionDialog,
  OpportunityInteractionComposer,
} from "./interaction-forms";
import {
  formatInteractionDay,
  INTERACTION_TYPES,
  InteractionEntry,
  interactionMeta,
  sinceLabel,
} from "./interaction-ui";

function useInteractions(filters: InteractionFilters) {
  return useQuery({
    queryKey: [INTERACTION_API_KEY, filters],
    queryFn: () => getInteractions(filters),
  });
}

const MONTHS_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function monthOf(isoDay: string) {
  const [y, m] = isoDay.split("-");
  return `${MONTHS_LONG[Number(m) - 1]} ${y}`;
}

const chip = (active: boolean) =>
  cn(
    "rounded-lg px-2.5 py-1 text-xs font-medium ring-1 transition-all",
    active
      ? "bg-ink text-white ring-ink"
      : "bg-surface text-slate-brand ring-brand-border hover:ring-electric/40",
  );

const pill = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors",
    active
      ? "bg-ink text-white ring-ink"
      : "bg-surface text-slate-brand ring-brand-border hover:text-ink",
  );

const pillCount = (active: boolean) =>
  cn(
    "rounded-md px-1.5 text-[11px] font-semibold",
    active
      ? "bg-white/20 text-white"
      : "bg-brand-border-light text-slate-brand",
  );

function Loading() {
  return (
    <div className="flex justify-center py-10">
      <LoadingSpinner />
    </div>
  );
}

function Empty({ children }: { children: string }) {
  return (
    <p className="py-10 text-center text-sm text-muted-brand">{children}</p>
  );
}

// ── Opportunity page ──

/** Composer (CRM_MANAGE) with the Opportunity's own timeline right below. */
export function OpportunityInteractions({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  const { canManage } = useCommercialAccess();
  const { data: interactions, isLoading } = useInteractions({
    opportunityId: opportunity.id,
  });
  const count = interactions?.length ?? 0;

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="rounded-2xl border border-brand-border bg-surface p-4">
          <p className="mb-3 text-sm font-semibold text-ink">
            Registrar interacción
          </p>
          <OpportunityInteractionComposer opportunity={opportunity} />
        </div>
      )}

      <div className="rounded-2xl border border-brand-border bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Interacciones
          </h2>
          <span className="rounded-md bg-electric/[0.08] px-1.5 py-0.5 text-[11px] font-semibold text-electric">
            {count}
          </span>
          <span className="ml-auto text-xs text-muted-brand">
            Solo las de esta oportunidad · las demás están en la{" "}
            <Link
              href={`/companies/${opportunity.companyId}`}
              className="font-medium text-electric hover:underline"
            >
              empresa
            </Link>
          </span>
        </div>
        {isLoading ? (
          <Loading />
        ) : count === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-ink">
              Todavía no hay interacciones.
            </p>
            {canManage && (
              <p className="mt-1 text-xs text-slate-brand">
                Registrá la primera llamada, reunión o email arriba.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-brand-border-light">
            {interactions!.map((i) => (
              <InteractionEntry
                key={i.id}
                interaction={i}
                canManage={canManage}
                showOpportunity={false}
                className="py-3"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Company page ──

/**
 * The Company's Interacciones tab: everything recorded with this Company at
 * the time, including people who have since left. Filter by Opportunity and
 * type; grouped by month.
 */
export function CompanyInteractionsTab({
  company,
}: {
  company: { id: number; name: string };
}) {
  const { canManage } = useCommercialAccess();
  const [logOpen, setLogOpen] = useState(false);
  const [opportunity, setOpportunity] = useState<"all" | "none" | number>(
    "all",
  );
  const [type, setType] = useState<InteractionType | "all">("all");
  const { data: interactions = [], isLoading } = useInteractions({
    companyId: company.id,
  });

  const list = interactions.filter(
    (i) =>
      (opportunity === "all" ||
        (opportunity === "none"
          ? i.opportunityId == null
          : i.opportunityId === opportunity)) &&
      (type === "all" || i.type === type),
  );
  const groups: { month: string; items: Interaction[] }[] = [];
  for (const i of list) {
    const month = monthOf(i.date);
    const last = groups.at(-1);
    if (last && last.month === month) last.items.push(i);
    else groups.push({ month, items: [i] });
  }
  const tiedOpportunities = [
    ...new Map(
      interactions
        .filter((i) => i.opportunity)
        .map((i) => [i.opportunity!.id, i.opportunity!]),
    ).values(),
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-4">
        {canManage && (
          <Button
            className="w-full bg-electric text-white hover:bg-electric-light"
            onClick={() => setLogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Registrar interacción
          </Button>
        )}
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-brand">
            Oportunidad
          </p>
          <div className="flex flex-col items-start gap-1">
            <button
              type="button"
              className={chip(opportunity === "all")}
              onClick={() => setOpportunity("all")}
            >
              Todas
            </button>
            <button
              type="button"
              className={chip(opportunity === "none")}
              onClick={() => setOpportunity("none")}
            >
              Solo la empresa
            </button>
            {tiedOpportunities.map((o) => (
              <button
                key={o.id}
                type="button"
                className={cn(
                  chip(opportunity === o.id),
                  "max-w-full truncate text-left",
                )}
                onClick={() => setOpportunity(o.id)}
              >
                {o.title}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-brand">
            Tipo
          </p>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className={chip(type === "all")}
              onClick={() => setType("all")}
            >
              Todos
            </button>
            {INTERACTION_TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                className={chip(type === t.key)}
                onClick={() => setType(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="rounded-2xl border border-brand-border bg-surface px-5 py-3">
        {isLoading ? (
          <Loading />
        ) : groups.length === 0 ? (
          <Empty>
            {interactions.length === 0
              ? "Sin interacciones registradas."
              : "Nada con estos filtros."}
          </Empty>
        ) : (
          groups.map((group) => (
            <div key={group.month} className="py-2">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-brand">
                {group.month}
              </p>
              <div className="divide-y divide-brand-border-light">
                {group.items.map((i) => (
                  <InteractionEntry
                    key={i.id}
                    interaction={i}
                    canManage={canManage}
                    className="py-3"
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {canManage && (
        <CompanyInteractionDialog
          company={company}
          open={logOpen}
          onOpenChange={setLogOpen}
        />
      )}
    </div>
  );
}

// ── Contact page ──

/**
 * The Contact's Interacciones tab: every Company the person has been at, with
 * "Empresa en ese momento" and a per-Company filter.
 */
export function ContactInteractionsTab({
  contact,
}: {
  contact: NetworkContact;
}) {
  const { canManage } = useCommercialAccess();
  const [logOpen, setLogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const { data: interactions = [], isLoading } = useInteractions({
    contactId: contact.id,
  });
  const firstName = contact.name.split(" ")[0];

  const keyOf = (i: Interaction) =>
    i.companyId == null ? "none" : String(i.companyId);
  const companies = [
    ...new Map(
      interactions.map((i) => [
        keyOf(i),
        { key: keyOf(i), company: i.company, count: 0 },
      ]),
    ).values(),
  ].map((block) => ({
    ...block,
    count: interactions.filter((i) => keyOf(i) === block.key).length,
  }));
  const list =
    filter === "all"
      ? interactions
      : interactions.filter((i) => keyOf(i) === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={pill(filter === "all")}
            onClick={() => setFilter("all")}
          >
            Todas
            <span className={pillCount(filter === "all")}>
              {interactions.length}
            </span>
          </button>
          {companies.length > 1 &&
            companies.map((block) => (
              <button
                key={block.key}
                type="button"
                className={pill(filter === block.key)}
                onClick={() => setFilter(block.key)}
              >
                {block.company ? (
                  <>
                    <Building2 className="h-3.5 w-3.5" />
                    {block.company.name}
                    {block.company.id === contact.companyId && (
                      <span
                        className={cn(
                          "text-xs",
                          filter === block.key
                            ? "text-white/80"
                            : "text-muted-brand",
                        )}
                      >
                        · actual
                      </span>
                    )}
                  </>
                ) : (
                  "Sin empresa"
                )}
                <span className={pillCount(filter === block.key)}>
                  {block.count}
                </span>
              </button>
            ))}
        </div>
        {canManage && (
          <Button
            size="sm"
            className="bg-electric text-white hover:bg-electric-light"
            onClick={() => setLogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Registrar interacción
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
        {isLoading ? (
          <Loading />
        ) : list.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-ink">
              Todavía no hay interacciones con {firstName}.
            </p>
            {canManage && (
              <p className="mt-1 text-xs text-slate-brand">
                Registrá dónde se conocieron o la primera llamada.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-xs font-semibold text-slate-brand">
                <th className="w-[120px] px-5 py-3">Fecha</th>
                <th className="w-[120px] px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Resumen</th>
                <th className="w-[200px] px-3 py-3">Empresa en ese momento</th>
                <th className="w-[110px] px-5 py-3 text-right">Registró</th>
              </tr>
            </thead>
            <tbody>
              {list.map((i) => {
                const meta = interactionMeta(i.type);
                const Icon = meta.icon;
                const others = i.contacts.filter((c) => c.id !== contact.id);
                return (
                  <tr
                    key={i.id}
                    className="border-b border-brand-border-light align-top last:border-0"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink">
                        {formatInteractionDay(i.date)}
                      </p>
                      <p className="text-xs text-muted-brand">
                        {sinceLabel(i.date)}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-brand">
                        <Icon className="h-4 w-4 text-electric" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <p className="whitespace-pre-wrap leading-relaxed text-ink">
                        {i.summary}
                      </p>
                      {(others.length > 0 || i.opportunity) && (
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-brand">
                          {others.length > 0 && (
                            <span>
                              Con {others.map((c) => c.name).join(", ")}
                            </span>
                          )}
                          {i.opportunity && (
                            <Link
                              href={`/opportunities/${i.opportunity.id}`}
                              className="font-medium text-electric hover:underline"
                            >
                              ↳ {i.opportunity.title}
                            </Link>
                          )}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      {i.company ? (
                        <Link
                          href={`/companies/${i.company.id}`}
                          className="inline-flex items-center gap-1.5 text-ink hover:text-electric"
                        >
                          <Building2 className="h-3.5 w-3.5 text-muted-brand" />
                          {i.company.name}
                        </Link>
                      ) : (
                        <span className="text-muted-brand">Sin empresa</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-slate-brand">
                      {i.createdByUser?.name.split(" ")[0] ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {canManage && (
        <ContactInteractionDialog
          contact={contact}
          open={logOpen}
          onOpenChange={setLogOpen}
        />
      )}
    </div>
  );
}
