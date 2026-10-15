"use client";

import { useQuery } from "@tanstack/react-query";
import { Handshake, Target, Trophy, Users, Wallet } from "lucide-react";

import type { CommercialSummary } from "@workspace/shared/types/dashboard";
import {
  DashboardStatCard,
  MonthlyVariation,
} from "@/components/dashboard/dashboard-stat-cards";
import {
  COMMERCIAL_SUMMARY_API_KEY,
  getCommercialSummary,
} from "@/lib/api/dashboard";
import { formatMoney, getInitials } from "@/lib/utils";

const COLUMNS = "sm:grid-cols-[1fr_repeat(5,_minmax(0,_auto))]";

/**
 * «Comercial» Dashboard section: three stat cards and the per-owner table for
 * the current calendar year. Rendered only for users with commercial access.
 */
export function CommercialSection() {
  const { data, isLoading } = useQuery<CommercialSummary>({
    queryKey: [COMMERCIAL_SUMMARY_API_KEY],
    queryFn: getCommercialSummary,
  });

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-electric">
          <Handshake className="h-4 w-4" />
        </div>
        <h2 className="text-base font-bold tracking-tight text-ink">
          Comercial
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <DashboardStatCard
          label="Oportunidades abiertas"
          icon={Target}
          accent="electric"
          value={data?.open}
          footer={
            data && <MonthlyVariation variation={data.createdThisMonth} />
          }
        />
        <DashboardStatCard
          label="Fee en juego"
          icon={Wallet}
          accent="violet"
          value={data ? formatMoney(data.openFee) : undefined}
        />
        <DashboardStatCard
          label="Ganado en el año"
          icon={Trophy}
          accent="teal"
          value={data ? formatMoney(data.wonFeeThisYear) : undefined}
          footer={
            data && (
              <span className="text-xs text-muted-brand">
                {data.wonThisYear}{" "}
                {data.wonThisYear === 1
                  ? "oportunidad ganada"
                  : "oportunidades ganadas"}
              </span>
            )
          }
        />
      </div>

      <CommercialOwnersTable
        owners={data?.owners ?? []}
        isLoading={isLoading}
      />
    </section>
  );
}

function CommercialOwnersTable({
  owners,
  isLoading,
}: {
  owners: CommercialSummary["owners"];
  isLoading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-electric">
            <Users className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold tracking-tight text-ink">
            Rendimiento comercial por responsable
          </h3>
        </div>
        <span className="text-[11px] font-medium text-muted-brand">
          {new Date().getFullYear()}
        </span>
      </div>

      {isLoading ? (
        <div className="divide-y divide-brand-border-light">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="h-8 w-8 rounded-full bg-brand-border-light animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-28 rounded bg-brand-border-light animate-pulse" />
                <div className="h-3 w-40 rounded bg-brand-border-light animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : owners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-brand">
          <Users className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">Sin oportunidades este año</p>
        </div>
      ) : (
        <>
          <div
            className={`hidden sm:grid ${COLUMNS} items-center gap-3 px-5 py-2.5 border-b border-brand-border-light bg-canvas/50`}
          >
            <HeaderCell className="text-left">Responsable</HeaderCell>
            <HeaderCell className="w-20">Abiertas</HeaderCell>
            <HeaderCell className="w-32">Fee en juego</HeaderCell>
            <HeaderCell className="w-20">Ganadas</HeaderCell>
            <HeaderCell className="w-32">Fee ganado</HeaderCell>
            <HeaderCell className="w-24">Tasa de cierre</HeaderCell>
          </div>

          <div className="divide-y divide-brand-border-light">
            {owners.map((owner) => (
              <div
                key={owner.ownerId}
                className={`grid grid-cols-1 ${COLUMNS} items-center gap-3 px-5 py-3.5 transition-colors hover:bg-electric/[0.03]`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-electric/5 text-electric text-xs font-semibold flex-shrink-0">
                    {getInitials(owner.name)}
                  </div>
                  <span className="text-sm font-semibold text-ink truncate">
                    {owner.name}
                  </span>
                </div>

                <div className="sm:contents grid grid-cols-3 gap-2 mt-2 sm:mt-0">
                  <ValueCell className="w-20">{owner.open}</ValueCell>
                  <ValueCell className="w-32">
                    {formatMoney(owner.openFee)}
                  </ValueCell>
                  <ValueCell className="w-20">{owner.won}</ValueCell>
                  <ValueCell className="w-32">
                    {formatMoney(owner.wonFee)}
                  </ValueCell>
                  <div className="flex sm:justify-center items-center w-24">
                    {owner.closeRate != null ? (
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                          owner.closeRate >= 70
                            ? "bg-emerald-50 text-emerald-600"
                            : owner.closeRate >= 40
                              ? "bg-amber-50 text-amber-600"
                              : "bg-red-50 text-red-500"
                        }`}
                      >
                        {owner.closeRate}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-brand">—</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HeaderCell({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`text-[11px] font-semibold text-muted-brand uppercase tracking-wider text-center ${className}`}
    >
      {children}
    </span>
  );
}

function ValueCell({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex sm:justify-center items-center ${className}`}>
      <span className="text-sm font-medium text-ink tabular-nums">
        {children}
      </span>
    </div>
  );
}
