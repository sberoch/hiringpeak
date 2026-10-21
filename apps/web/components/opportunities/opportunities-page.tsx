"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Handshake,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { getOpportunities, OPPORTUNITY_API_KEY } from "@/lib/api/opportunity";
import { formatMoney } from "@/lib/utils";
import { groupOpportunitiesByStage } from "@workspace/shared/lib/opportunities-by-stage";
import type {
  OpportunityFilters,
  OpportunityListItem,
  OpportunityStage,
} from "@workspace/shared/types/opportunity";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { LoadingSpinner } from "@workspace/ui/components/loading-spinner";
import { PageHeading } from "@workspace/ui/components/page-heading";
import { cn } from "@workspace/ui/lib/utils";

import { NewOpportunityButton } from "./new-opportunity-sheet";
import { stageTone } from "@/components/opportunities/stage-badge";
import { useCommercialAccess } from "@/components/opportunities/commercial-access";
import { useOpportunityStages } from "@/components/opportunities/commercial-queries";
import {
  ActiveFilterChips,
  activeFilterCount,
  OpportunityFilterPanel,
  type OpportunityPanelFilters,
} from "./opportunity-filter-panel";
import {
  opportunityColumns,
  type OpportunityCellContext,
  type OpportunityColumn,
} from "./opportunity-table-columns";
import { useStageChange } from "./stage-change";

function useDebounced<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function OpportunitiesPage() {
  const { canManage } = useCommercialAccess();
  const session = useSession();
  const myId =
    session.status === "authenticated" && session.data?.userId
      ? parseInt(session.data.userId, 10)
      : undefined;

  const [search, setSearch] = useState("");
  const [panelFilters, setPanelFilters] = useState<OpportunityPanelFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  /** Explicit expand/collapse choices; groups not in here use their default. */
  const [collapsedOverride, setCollapsedOverride] = useState<
    Record<number, boolean>
  >({});

  const debouncedSearch = useDebounced(search);
  const filters: OpportunityFilters = {
    ...panelFilters,
    search: debouncedSearch.trim() || undefined,
  };
  const panelFilterCount = activeFilterCount(panelFilters);

  const { data: stages, isLoading: stagesLoading } = useOpportunityStages();
  const { data: opportunities, isLoading } = useQuery({
    queryKey: [OPPORTUNITY_API_KEY, filters],
    queryFn: () => getOpportunities(filters),
    placeholderData: (previous) => previous,
  });
  const { requestMove, dialog } = useStageChange();
  const columns = opportunityColumns;

  const summary = groupOpportunitiesByStage(stages ?? [], opportunities ?? []);
  const filtering = !!filters.search || panelFilterCount > 0;
  const isCollapsed = (stage: OpportunityStage, byDefault: boolean) =>
    collapsedOverride[stage.id] ??
    (stage.isLost && panelFilters.lostReasonId != null ? false : byDefault);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          icon={Handshake}
          title="Oportunidades"
          description="Posibles trabajos con cada empresa, por etapa."
        />
        <NewOpportunityButton />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-brand" />
          <Input
            type="search"
            placeholder="Buscar oportunidad o empresa…"
            className="rounded-xl border-brand-border bg-surface pl-9 placeholder:text-muted-brand focus:border-electric focus:ring-electric/10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setFiltersOpen(true)}
          className="relative gap-2 rounded-xl border-brand-border text-slate-brand transition-all hover:border-electric hover:bg-electric/5 hover:text-ink"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {panelFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-electric px-1.5 text-[11px] font-bold text-white">
              {panelFilterCount}
            </span>
          )}
        </Button>
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-brand">
          <button
            type="button"
            className="hover:text-electric"
            onClick={() =>
              setCollapsedOverride(
                Object.fromEntries((stages ?? []).map((s) => [s.id, false])),
              )
            }
          >
            Expandir todo
          </button>
          <button
            type="button"
            className="hover:text-electric"
            onClick={() =>
              setCollapsedOverride(
                Object.fromEntries((stages ?? []).map((s) => [s.id, true])),
              )
            }
          >
            Colapsar todo
          </button>
        </div>
      </div>

      {panelFilterCount > 0 && (
        <ActiveFilterChips
          filters={panelFilters}
          onFiltersChange={setPanelFilters}
          myId={myId}
        />
      )}

      <OpportunityFilterPanel
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={panelFilters}
        onFiltersChange={setPanelFilters}
        myId={myId}
      />

      <div className="overflow-clip rounded-2xl border border-brand-border bg-surface">
        {isLoading || stagesLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <table className="w-full table-fixed text-sm">
            <colgroup>
              {columns.map((column) => (
                <col key={column.key} className={column.width} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-brand-border bg-canvas text-left text-[11px] font-semibold uppercase tracking-wide text-slate-brand">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-3 py-2",
                      column.align === "right" && "text-right",
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            {summary.groups.map((group) => {
              if (filtering && group.count === 0) return null;
              const collapsed = isCollapsed(group.stage, group.collapsed);
              const tone = stageTone(group.stage);
              const noNextStepCount = group.items.filter(
                (o) => o.noNextStep,
              ).length;
              return (
                <tbody key={group.stage.id}>
                  <tr
                    className={cn(
                      "cursor-pointer select-none border-y border-brand-border",
                      tone.bg,
                    )}
                    onClick={() =>
                      setCollapsedOverride((prev) => ({
                        ...prev,
                        [group.stage.id]: !collapsed,
                      }))
                    }
                  >
                    <td colSpan={columns.length} className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        {collapsed ? (
                          <ChevronRight className="h-5 w-5 text-slate-brand" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-brand" />
                        )}
                        <span
                          className={cn(
                            "h-2.5 w-2.5 shrink-0 rounded-full",
                            tone.dot,
                          )}
                        />
                        <span className={cn("text-sm font-bold", tone.text)}>
                          {group.stage.name}
                        </span>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-slate-brand ring-1 ring-brand-border">
                          {group.count}
                        </span>
                        <div className="ml-auto flex items-center gap-6">
                          {noNextStepCount > 0 && (
                            <span className="text-sm font-semibold text-red-600">
                              {noNextStepCount} sin próximo paso
                            </span>
                          )}
                          <span className="text-sm text-slate-brand">
                            Subtotal{" "}
                            <FeeTotal
                              total={group.estimatedFeeTotal}
                              className="font-semibold text-ink"
                            />
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {!collapsed &&
                    group.items.map((opportunity) => (
                      <OpportunityRow
                        key={opportunity.id}
                        opportunity={opportunity}
                        columns={columns}
                        context={{
                          stages: stages ?? [],
                          canManage,
                          onMove: (stage) => requestMove(opportunity, stage),
                        }}
                      />
                    ))}
                  {!collapsed && group.count === 0 && (
                    <tr className="border-b border-brand-border-light">
                      <td
                        colSpan={columns.length}
                        className="px-10 py-2 text-xs text-muted-brand"
                      >
                        Sin oportunidades en esta etapa.
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>
        )}
        {!isLoading && filtering && opportunities?.length === 0 && (
          <p className="px-6 py-14 text-center text-sm text-muted-brand">
            Ninguna oportunidad coincide con los filtros.
          </p>
        )}
      </div>

      {dialog}
    </div>
  );
}

function FeeTotal({ total, className }: { total: number; className?: string }) {
  if (!total) return <span className="text-muted-brand">—</span>;
  return (
    <span className={cn("whitespace-nowrap tabular-nums", className)}>
      {formatMoney(total)}
    </span>
  );
}
function OpportunityRow({
  opportunity,
  columns,
  context,
}: {
  opportunity: OpportunityListItem;
  columns: OpportunityColumn[];
  context: OpportunityCellContext;
}) {
  const closed = opportunity.stage.isWon || opportunity.stage.isLost;
  return (
    <tr
      className={cn(
        "border-b border-brand-border-light hover:bg-canvas/70",
        closed && "text-slate-brand",
      )}
    >
      {columns.map((column) => (
        <td
          key={column.key}
          className={cn(
            typeof column.cellClassName === "function"
              ? column.cellClassName(opportunity)
              : column.cellClassName,
            column.align === "right" && "text-right",
          )}
        >
          {column.cell(opportunity, context)}
        </td>
      ))}
    </tr>
  );
}
