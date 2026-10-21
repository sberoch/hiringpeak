"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlarmClock,
  ArrowDown,
  ArrowUp,
  Briefcase,
  Clock,
  DollarSign,
  Target,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import type {
  CommercialSummary,
  Dashboard,
} from "@workspace/shared/types/dashboard";

import {
  CANDIDATES_ADDED_API_KEY,
  COMMERCIAL_SUMMARY_API_KEY,
  DASHBOARD_SUMMARY_API_KEY,
  getCandidatesAddedCount,
  getCommercialSummary,
  getDashboardSummary,
  getMyActiveVacancyCount,
  MY_ACTIVE_VACANCIES_API_KEY,
} from "@/lib/api/dashboard";
import { getMyOverdueTaskCount, TASK_API_KEY } from "@/lib/api/tasks";
import { formatMoney } from "@/lib/utils";

const VARIATION_POSITIVE = "text-emerald-600";
const VARIATION_NEGATIVE = "text-red-500";

const accentStyles = {
  electric: {
    iconBg: "bg-electric shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]",
    cardBg: "bg-[#f0f6ff]",
    hoverBorder: "hover:border-electric/20",
    hoverShadow: "hover:shadow-[0_12px_32px_-8px_rgba(0,102,255,0.12)]",
    orb: "bg-electric/[0.05]",
  },
  violet: {
    iconBg: "bg-violet-600 shadow-[0_2px_8px_-2px_rgba(124,58,237,0.4)]",
    cardBg: "bg-[#f5f0ff]",
    hoverBorder: "hover:border-violet-500/20",
    hoverShadow: "hover:shadow-[0_12px_32px_-8px_rgba(124,58,237,0.12)]",
    orb: "bg-violet-500/[0.05]",
  },
  teal: {
    iconBg: "bg-teal shadow-[0_2px_8px_-2px_rgba(13,148,136,0.4)]",
    cardBg: "bg-[#f0fdf9]",
    hoverBorder: "hover:border-teal/20",
    hoverShadow: "hover:shadow-[0_12px_32px_-8px_rgba(13,148,136,0.12)]",
    orb: "bg-teal/[0.05]",
  },
};

type StatAccent = keyof typeof accentStyles;

/** "+N este mes" line under a stat value. */
export function MonthlyVariation({ variation }: { variation: number }) {
  return (
    <div className="flex items-center gap-1 text-sm font-medium text-slate-brand">
      <span
        className={`flex items-center gap-0.5 text-xs font-semibold ${
          variation >= 0 ? VARIATION_POSITIVE : VARIATION_NEGATIVE
        }`}
      >
        {variation >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
        {variation >= 0 ? "+" : ""}
        {variation}
      </span>
      <span className="text-xs font-normal text-muted-brand">este mes</span>
    </div>
  );
}

interface DashboardStatCardProps {
  label: string;
  icon: LucideIcon;
  accent: StatAccent;
  value: ReactNode;
  suffix?: string;
  image?: { src: string; position: string };
  footer?: ReactNode;
}

export function DashboardStatCard({
  label,
  icon: Icon,
  accent,
  value,
  suffix,
  image,
  footer,
}: DashboardStatCardProps) {
  const styles = accentStyles[accent];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-brand-border ${styles.cardBg} p-6 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 ${styles.hoverBorder} ${styles.hoverShadow}`}
    >
      {/* Background illustration */}
      {image && (
        <div
          className={`pointer-events-none absolute ${image.position} w-1/2 h-[180px] opacity-[0.08] transition-opacity duration-300 group-hover:opacity-[0.14]`}
        >
          <Image
            src={image.src}
            alt=""
            fill
            className="object-contain object-center-right w-full object-right"
            sizes="(min-width: 640px) 16vw, 50vw"
          />
        </div>
      )}

      {/* Subtle accent orb */}
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full ${styles.orb} blur-2xl`}
      />

      {/* Content */}
      <div className="relative flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-white flex-shrink-0 ${styles.iconBg}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="text-sm text-slate-brand">{label}</div>
          <div className="text-2xl font-bold tracking-tight text-ink">
            {value != null ? (
              <>
                {value}
                {suffix && (
                  <span className="ml-1 text-base font-semibold text-slate-brand">
                    {suffix}
                  </span>
                )}
              </>
            ) : (
              "—"
            )}
          </div>
          {footer}
        </div>
      </div>
    </div>
  );
}

interface StatConfig<T> {
  label: string;
  icon: LucideIcon;
  image: { src: string; position: string };
  accent: StatAccent;
  suffix?: string;
  /** Widgets reading the same data share this key, so it loads once. */
  queryKey: readonly unknown[];
  queryFn: () => Promise<T>;
  getValue: (data: T) => ReactNode;
  getVariation?: (data: T) => number;
}

/**
 * A stat Widget. Its data loads only while it is shown, once for every
 * stat on screen that reads it.
 */
function stat<T>(config: StatConfig<T>) {
  return function Stat() {
    const { data } = useQuery({
      queryKey: config.queryKey,
      queryFn: config.queryFn,
    });
    const variation = data && config.getVariation?.(data);

    return (
      <DashboardStatCard
        label={config.label}
        icon={config.icon}
        accent={config.accent}
        value={data ? config.getValue(data) : undefined}
        suffix={config.suffix}
        image={config.image}
        footer={
          variation !== undefined && <MonthlyVariation variation={variation} />
        }
      />
    );
  };
}

/** A stat read from the dashboard summary. */
function summaryStat(
  config: Omit<StatConfig<Dashboard>, "queryKey" | "queryFn">,
) {
  return stat({
    ...config,
    queryKey: [DASHBOARD_SUMMARY_API_KEY],
    queryFn: getDashboardSummary,
  });
}

/** A commercial stat read from the «Comercial» summary. */
function commercialStat(
  config: Omit<StatConfig<CommercialSummary>, "queryKey" | "queryFn">,
) {
  return stat({
    ...config,
    queryKey: [COMMERCIAL_SUMMARY_API_KEY],
    queryFn: getCommercialSummary,
  });
}

export const ActiveVacanciesStat = summaryStat({
  label: "Búsquedas activas",
  icon: Briefcase,
  image: { src: "/images/stat-search.png", position: "-right-12 -top-4" },
  accent: "electric",
  getValue: (d) => d.activeVacancies,
  getVariation: (d) => d.monthlyVacancies,
});

export const ActiveCandidatesStat = summaryStat({
  label: "Postulantes activos",
  icon: Users,
  image: {
    src: "/images/stat-ideal-candidate.jpeg",
    position: "-right-8 top-0",
  },
  accent: "violet",
  getValue: (d) => d.activeCandidates,
  getVariation: (d) => d.monthlyCandidates,
});

export const AvgDaysOpenStat = summaryStat({
  label: "Prom. días de gestión",
  icon: Clock,
  image: { src: "/images/stat-time.png", position: "-right-10 -top-6" },
  accent: "teal",
  suffix: "días",
  getValue: (d) => d.avgDaysOpen,
});

export const MyActiveVacanciesStat = stat({
  label: "Mis búsquedas activas",
  icon: UserCheck,
  image: { src: "/images/stat-search.png", position: "-right-12 -top-4" },
  accent: "electric",
  queryKey: [MY_ACTIVE_VACANCIES_API_KEY],
  queryFn: getMyActiveVacancyCount,
  getValue: (d) => d.count,
});

export const MyOverdueTasksStat = stat({
  label: "Mis tareas vencidas",
  icon: AlarmClock,
  image: { src: "/images/stat-time.png", position: "-right-10 -top-6" },
  accent: "teal",
  queryKey: [TASK_API_KEY, "overdue-count"],
  queryFn: getMyOverdueTaskCount,
  getValue: (d) => d.count,
});

export const CandidatesAddedStat = stat({
  label: "Candidatos agregados (últ. 30 días)",
  icon: UserPlus,
  image: {
    src: "/images/stat-ideal-candidate.jpeg",
    position: "-right-8 top-0",
  },
  accent: "violet",
  queryKey: [CANDIDATES_ADDED_API_KEY],
  queryFn: getCandidatesAddedCount,
  getValue: (d) => d.count,
});

export const OpenOpportunitiesStat = commercialStat({
  label: "Oportunidades abiertas",
  icon: Target,
  image: { src: "/images/stat-search.png", position: "-right-12 -top-4" },
  accent: "violet",
  getValue: (d) => d.open,
  getVariation: (d) => d.createdThisMonth,
});

export const PipelineFeeStat = commercialStat({
  label: "Fee estimado en pipeline",
  icon: DollarSign,
  image: { src: "/images/stat-time.png", position: "-right-10 -top-6" },
  accent: "electric",
  getValue: (d) => formatMoney(d.openFee),
});
