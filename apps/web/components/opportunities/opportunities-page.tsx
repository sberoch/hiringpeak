"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Handshake, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getOpportunities, OPPORTUNITY_API_KEY } from "@/lib/api/opportunity";
import { formatMoney } from "@/lib/utils";
import { CompanyStatus } from "@workspace/shared/enums";
import { groupOpportunitiesByStage } from "@workspace/shared/lib/opportunities-by-stage";
import type {
  OpportunityFilters,
  OpportunityListItem,
  OpportunityStage,
} from "@workspace/shared/types/opportunity";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { LoadingSpinner } from "@workspace/ui/components/loading-spinner";
import { PageHeading } from "@workspace/ui/components/page-heading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";

import { LastInteractionLabel } from "@/components/interactions/interaction-ui";
import { NewOpportunityButton } from "./new-opportunity-sheet";
import { NextStepCell } from "./opportunity-next-step";
import {
  opportunityHref,
  StageBadge,
  stageTone,
  useCommercialAccess,
  useCommercialUsers,
  useLostReasons,
  useOpportunityStages,
} from "./opportunity-ui";
import { useStageChange } from "./stage-change";

const ALL = "all";
const MINE = "me";
/** Table columns, for the full-width group header and empty rows. */
const COLUMN_COUNT = 7;

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
  const [owner, setOwner] = useState(ALL);
  const [lostReason, setLostReason] = useState(ALL);
  const [companyStatus, setCompanyStatus] = useState(ALL);
  const [onlyNoNextStep, setOnlyNoNextStep] = useState(false);
  /** Explicit expand/collapse choices; groups not in here use their default. */
  const [collapsedOverride, setCollapsedOverride] = useState<
    Record<number, boolean>
  >({});

  const debouncedSearch = useDebounced(search);
  const filters: OpportunityFilters = {
    search: debouncedSearch.trim() || undefined,
    ownerId: owner === ALL ? undefined : owner === MINE ? myId : Number(owner),
    lostReasonId: lostReason === ALL ? undefined : Number(lostReason),
    companyStatus:
      companyStatus === ALL ? undefined : (companyStatus as CompanyStatus),
    noNextStep: onlyNoNextStep || undefined,
  };

  const { data: stages, isLoading: stagesLoading } = useOpportunityStages();
  const { data: lostReasons = [] } = useLostReasons();
  const { data: commercialUsers = [] } = useCommercialUsers();
  const { data: opportunities, isLoading } = useQuery({
    queryKey: [OPPORTUNITY_API_KEY, filters],
    queryFn: () => getOpportunities(filters),
    placeholderData: (previous) => previous,
  });
  const { requestMove, dialog } = useStageChange();

  const summary = groupOpportunitiesByStage(stages ?? [], opportunities ?? []);
  const filtering =
    !!filters.search ||
    owner !== ALL ||
    lostReason !== ALL ||
    companyStatus !== ALL ||
    onlyNoNextStep;
  const isCollapsed = (stage: OpportunityStage, byDefault: boolean) =>
    collapsedOverride[stage.id] ??
    (stage.isLost && lostReason !== ALL ? false : byDefault);

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

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-border bg-surface p-2">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-brand" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar oportunidad o empresa…"
            className="h-9 bg-surface pl-8 text-sm"
          />
        </div>
        <Select value={owner} onValueChange={setOwner}>
          <SelectTrigger className="h-9 w-[210px] bg-surface text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los responsables</SelectItem>
            {myId != null && <SelectItem value={MINE}>Mías</SelectItem>}
            {commercialUsers.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={lostReason} onValueChange={setLostReason}>
          <SelectTrigger className="h-9 w-[220px] bg-surface text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los motivos</SelectItem>
            {lostReasons.map((reason) => (
              <SelectItem key={reason.id} value={String(reason.id)}>
                {reason.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={companyStatus} onValueChange={setCompanyStatus}>
          <SelectTrigger className="h-9 w-[200px] bg-surface text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Prospectos y clientes</SelectItem>
            <SelectItem value={CompanyStatus.PROSPECT}>
              Solo prospectos
            </SelectItem>
            <SelectItem value={CompanyStatus.CLIENT}>Solo clientes</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-1 flex items-center gap-2">
          <Checkbox
            id="only-no-next-step"
            checked={onlyNoNextStep}
            onCheckedChange={(checked) => setOnlyNoNextStep(checked === true)}
          />
          <Label
            htmlFor="only-no-next-step"
            className="cursor-pointer text-sm font-normal leading-none text-ink"
          >
            Solo sin próximo paso
          </Label>
        </div>
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
          {filtering && (
            <button
              type="button"
              className="font-semibold text-electric"
              onClick={() => {
                setSearch("");
                setOwner(ALL);
                setLostReason(ALL);
                setCompanyStatus(ALL);
                setOnlyNoNextStep(false);
              }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="overflow-clip rounded-2xl border border-brand-border bg-surface">
        {isLoading || stagesLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[13%]" />
              <col className="w-[11%]" />
              <col className="w-[18%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-brand-border bg-canvas text-left text-[11px] font-semibold uppercase tracking-wide text-slate-brand">
                <th className="px-3 py-2">Oportunidad</th>
                <th className="px-3 py-2">Empresa</th>
                <th className="px-3 py-2 text-right">Fee estimado</th>
                <th className="px-3 py-2">Próximo paso</th>
                <th className="px-3 py-2">Responsable</th>
                <th className="px-3 py-2">Últ. interacción</th>
                <th className="px-3 py-2">Etapa</th>
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
                    <td colSpan={COLUMN_COUNT} className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        {collapsed ? (
                          <ChevronRight className="h-5 w-5 text-slate-brand" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-brand" />
                        )}
                        <span
                          className={cn("h-2.5 w-2.5 rounded-full", tone.dot)}
                        />
                        <span className={cn("text-sm font-bold", tone.text)}>
                          {group.stage.name}
                        </span>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-slate-brand ring-1 ring-brand-border">
                          {group.count}
                        </span>
                        <span className="ml-3 text-sm text-slate-brand">
                          Subtotal{" "}
                          <FeeTotal
                            total={group.estimatedFeeTotal}
                            className="font-semibold text-ink"
                          />
                        </span>
                        {noNextStepCount > 0 && (
                          <span className="ml-3 text-sm font-semibold text-red-600">
                            {noNextStepCount} sin próximo paso
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {!collapsed &&
                    group.items.map((opportunity) => (
                      <OpportunityRow
                        key={opportunity.id}
                        opportunity={opportunity}
                        stages={stages ?? []}
                        canManage={canManage}
                        onMove={(stage) => requestMove(opportunity, stage)}
                      />
                    ))}
                  {!collapsed && group.count === 0 && (
                    <tr className="border-b border-brand-border-light">
                      <td
                        colSpan={COLUMN_COUNT}
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

      <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-brand-border bg-surface/95 px-4 py-2.5 text-sm shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.12)] backdrop-blur">
        <span className="text-slate-brand">
          Abiertas{filtering ? " (filtradas)" : ""}:{" "}
          <span className="font-bold text-ink">{summary.open.count}</span>
        </span>
        <span className="text-slate-brand">
          Total:{" "}
          <span className="font-bold tabular-nums text-ink">
            {formatMoney(summary.open.estimatedFeeTotal)}
          </span>
        </span>
        <span className="text-xs text-muted-brand">
          Sin ponderar. Ganadas y perdidas no suman.
        </span>
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
  stages,
  canManage,
  onMove,
}: {
  opportunity: OpportunityListItem;
  stages: OpportunityStage[];
  canManage: boolean;
  onMove: (stage: OpportunityStage) => void;
}) {
  const closed = opportunity.stage.isWon || opportunity.stage.isLost;
  return (
    <tr
      className={cn(
        "border-b border-brand-border-light hover:bg-canvas/70",
        closed && "text-slate-brand",
      )}
    >
      <td className="py-3 pl-9 pr-3">
        <Link
          href={opportunityHref(opportunity.id)}
          className="line-clamp-2 text-sm font-semibold leading-snug text-ink hover:text-electric"
          title={opportunity.title}
        >
          {opportunity.title}
        </Link>
      </td>
      <td className="px-3 py-3">
        <Link
          href={`/companies/${opportunity.company.id}`}
          className="block truncate text-slate-brand hover:text-electric"
        >
          {opportunity.company.name}
        </Link>
      </td>
      <td
        className={cn(
          "whitespace-nowrap px-3 py-3 text-right tabular-nums",
          opportunity.estimatedFee != null
            ? "font-semibold text-ink"
            : "text-muted-brand",
        )}
      >
        {opportunity.estimatedFee != null
          ? formatMoney(opportunity.estimatedFee)
          : "—"}
      </td>
      <td className="px-3 py-3">
        <NextStepCell opportunity={opportunity} />
      </td>
      <td className="truncate px-3 py-3 text-slate-brand">
        {opportunity.owner.name}
      </td>
      <td className="px-3 py-3">
        <LastInteractionLabel last={opportunity.lastInteraction} />
      </td>
      <td className="px-3 py-2">
        {canManage ? (
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
                      "h-1.5 w-1.5 rounded-full",
                      stageTone(stage).dot,
                    )}
                  />
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <StageBadge stage={opportunity.stage} />
        )}
      </td>
    </tr>
  );
}
