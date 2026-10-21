"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { formatMoney } from "@/lib/utils";
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

import { LastInteractionLabel } from "@/components/interactions/interaction-format";
import { opportunityHref } from "@/components/opportunities/opportunity-format";
import { StageBadge, stageTone } from "@/components/opportunities/stage-badge";
import { NextStepCell } from "./opportunity-next-step";

/** What a row's cells need beyond the Opportunity itself. */
export interface OpportunityCellContext {
  stages: OpportunityStage[];
  canManage: boolean;
  onMove: (stage: OpportunityStage) => void;
}

/** One column of the grouped Opportunities table. */
export interface OpportunityColumn {
  key: string;
  header: string;
  /** Tailwind width class for the column's `<col>`. */
  width: string;
  align?: "left" | "right";
  /** Classes for the `<td>`, beyond alignment. */
  cellClassName: string | ((opportunity: OpportunityListItem) => string);
  cell: (
    opportunity: OpportunityListItem,
    context: OpportunityCellContext,
  ) => ReactNode;
}

/** The Opportunities table's columns, in display order. */
export const opportunityColumns: OpportunityColumn[] = [
  {
    key: "title",
    header: "Oportunidad",
    width: "w-[20%]",
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
    width: "w-[13%]",
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
    width: "w-[11%]",
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
    width: "w-[18%]",
    cellClassName: "px-3 py-3",
    cell: (opportunity) => <NextStepCell opportunity={opportunity} />,
  },
  {
    key: "owner",
    header: "Responsable",
    width: "w-[11%]",
    cellClassName: "truncate px-3 py-3 text-slate-brand",
    cell: (opportunity) => opportunity.owner.name,
  },
  {
    key: "lastInteraction",
    header: "Últ. interacción",
    width: "w-[11%]",
    cellClassName: "px-3 py-3",
    cell: (opportunity) => (
      <LastInteractionLabel last={opportunity.lastInteraction} />
    ),
  },
  {
    key: "stage",
    header: "Etapa",
    width: "w-[16%]",
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
];
