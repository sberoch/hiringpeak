"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { formatMoney } from "@/lib/utils";
import type { OpportunityColumnKey } from "@workspace/shared/lib/column-catalogues";
import type {
  OpportunityListItem,
  OpportunityStage,
} from "@workspace/shared/types/opportunity";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";

import type { ColumnDefinition } from "@/components/column-layout/use-column-layout";
import { LastInteractionLabel } from "@/components/interactions/interaction-format";
import {
  formatDay,
  opportunityHref,
} from "@/components/opportunities/opportunity-format";
import { StageBadge, stageTone } from "@/components/opportunities/stage-badge";
import { NextStepCell } from "./opportunity-next-step";
import type { OpportunitySortField } from "@workspace/shared/dtos";

/** What a row's cells need beyond the Opportunity itself. */
export interface OpportunityCellContext {
  stages: OpportunityStage[];
  canManage: boolean;
  onMove: (stage: OpportunityStage) => void;
}

/** The list fields the server can sort Opportunities by. */
export type { OpportunitySortField };

/** One column of the grouped Opportunities table. */
export interface OpportunityColumn {
  key: OpportunityColumnKey;
  header: string;
  /**
   * Relative width. The visible columns share the table in proportion; the
   * default layout's widths add up to 100.
   */
  width: number;
  align?: "left" | "right";
  /** Sortable on the server by this field; its header toggles the order. */
  sortField?: OpportunitySortField;
  /** Classes for the `<td>`, beyond alignment. */
  cellClassName: string | ((opportunity: OpportunityListItem) => string);
  cell: (
    opportunity: OpportunityListItem,
    context: OpportunityCellContext,
  ) => ReactNode;
}

const columnList: OpportunityColumn[] = [
  {
    key: "title",
    header: "Oportunidad",
    width: 20,
    cellClassName: "py-3 pl-9 pr-3",
    cell: (opportunity) => (
      <Link
        href={opportunityHref(opportunity.id)}
        className="line-clamp-2 text-sm font-semibold leading-snug text-ink hover:text-electric"
        title={opportunity.title}
      >
        {opportunity.title}
      </Link>
    ),
  },
  {
    key: "company",
    header: "Empresa",
    width: 13,
    cellClassName: "px-3 py-3",
    cell: (opportunity) => (
      <Link
        href={`/companies/${opportunity.company.id}`}
        className="block truncate text-slate-brand hover:text-electric"
      >
        {opportunity.company.name}
      </Link>
    ),
  },
  {
    key: "estimatedFee",
    header: "Fee estimado",
    width: 11,
    align: "right",
    cellClassName: (opportunity) =>
      cn(
        "whitespace-nowrap px-3 py-3 tabular-nums",
        opportunity.estimatedFee != null
          ? "font-semibold text-ink"
          : "text-muted-brand",
      ),
    cell: (opportunity) =>
      opportunity.estimatedFee != null
        ? formatMoney(opportunity.estimatedFee)
        : "—",
  },
  {
    key: "nextStep",
    header: "Próximo paso",
    width: 18,
    cellClassName: "px-3 py-3",
    cell: (opportunity) => <NextStepCell opportunity={opportunity} />,
  },
  {
    key: "owner",
    header: "Responsable",
    width: 11,
    cellClassName: "truncate px-3 py-3 text-slate-brand",
    cell: (opportunity) => opportunity.owner.name,
  },
  {
    key: "lastInteraction",
    header: "Últ. interacción",
    width: 11,
    cellClassName: "px-3 py-3",
    cell: (opportunity) => (
      <LastInteractionLabel last={opportunity.lastInteraction} />
    ),
  },
  {
    key: "stage",
    header: "Etapa",
    width: 16,
    cellClassName: "px-3 py-2",
    cell: (opportunity, { stages, canManage, onMove }) =>
      canManage ? (
        <Select
          value={String(opportunity.stageId)}
          onValueChange={(value) => {
            const stage = stages.find((s) => s.id === Number(value));
            if (stage) onMove(stage);
          }}
        >
          <SelectTrigger
            size="sm"
            className="h-8 w-full border-transparent bg-transparent px-1.5 text-sm shadow-none hover:border-brand-border"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stages.map((stage) => (
              <SelectItem
                key={stage.id}
                value={String(stage.id)}
                className="text-sm"
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    stageTone(stage).dot,
                  )}
                />
                <span className="truncate">{stage.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <StageBadge stage={opportunity.stage} />
      ),
  },
  {
    key: "closeDate",
    header: "Fecha de cierre",
    width: 10,
    sortField: "closeDate",
    cellClassName: (opportunity) =>
      cn(
        "whitespace-nowrap px-3 py-3",
        opportunity.closeDate ? "text-slate-brand" : "text-muted-brand",
      ),
    cell: (opportunity) =>
      opportunity.closeDate ? formatDay(opportunity.closeDate) : "—",
  },
  {
    key: "contacts",
    header: "Contactos",
    width: 14,
    cellClassName: (opportunity) =>
      cn(
        "truncate px-3 py-3",
        opportunity.contacts.length ? "text-slate-brand" : "text-muted-brand",
      ),
    cell: (opportunity) => {
      if (opportunity.contacts.length === 0) return "—";
      const names = opportunity.contacts.map((c) => c.name).join(", ");
      return <span title={names}>{names}</span>;
    },
  },
  {
    key: "linkedVacancies",
    header: "Vacantes vinculadas",
    width: 9,
    align: "right",
    cellClassName: "whitespace-nowrap px-3 py-3 tabular-nums text-slate-brand",
    cell: (opportunity) => opportunity.vacancyCount,
  },
  {
    key: "createdAt",
    header: "Fecha de creación",
    width: 10,
    sortField: "createdAt",
    cellClassName: "whitespace-nowrap px-3 py-3 text-slate-brand",
    cell: (opportunity) => formatDay(opportunity.createdAt),
  },
  {
    key: "lostReason",
    header: "Motivo de pérdida",
    width: 12,
    cellClassName: (opportunity) =>
      cn(
        "truncate px-3 py-3",
        opportunity.lostReason ? "text-slate-brand" : "text-muted-brand",
      ),
    cell: (opportunity) => opportunity.lostReason?.name ?? "—",
  },
];

/** Every catalogue column of the Opportunities table, by key. */
export const opportunityColumns = Object.fromEntries(
  columnList.map((column) => [column.key, { label: column.header, column }]),
) as Record<OpportunityColumnKey, ColumnDefinition<OpportunityColumn>>;
