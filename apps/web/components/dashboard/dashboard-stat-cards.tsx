import { ArrowDown, ArrowUp, Briefcase, Clock, Users } from "lucide-react";
import Image from "next/image";

import type { Dashboard } from "@workspace/shared/types/dashboard";

interface DashboardStatCardsProps {
  data: Dashboard;
}

const cards = [
  {
    key: "vacancies",
    label: "Búsquedas activas",
    icon: Briefcase,
    image: "/images/stat-search.png",
    imagePosition: "-right-12 -top-4",
    accent: "electric" as const,
    getValue: (d: Dashboard) => d.activeVacancies,
    getVariation: (d: Dashboard) => d.monthlyVacancies,
  },
  {
    key: "candidates",
    label: "Postulantes activos",
    icon: Users,
    image: "/images/stat-ideal-candidate.jpeg",
    imagePosition: "-right-8 top-0",
    accent: "violet" as const,
    getValue: (d: Dashboard) => d.activeCandidates,
    getVariation: (d: Dashboard) => d.monthlyCandidates,
  },
  {
    key: "days",
    label: "Prom. días de gestión",
    icon: Clock,
    image: "/images/stat-time.png",
    imagePosition: "-right-10 -top-6",
    accent: "teal" as const,
    suffix: "días",
    getValue: (d: Dashboard) => d.avgDaysOpen,
    getVariation: () => undefined as number | undefined,
  },
] as const;

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

export function DashboardStatCards({ data }: DashboardStatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = card.getValue(data);
        const variation = card.getVariation(data);
        const styles = accentStyles[card.accent];

        return (
          <div
            key={card.key}
            className={`group relative overflow-hidden rounded-2xl border border-brand-border ${styles.cardBg} p-6 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 ${styles.hoverBorder} ${styles.hoverShadow}`}
          >
            {/* Background illustration */}
            <div
              className={`pointer-events-none absolute ${card.imagePosition} w-1/2 h-[180px] opacity-[0.08] transition-opacity duration-300 group-hover:opacity-[0.14]`}
            >
              <Image
                src={card.image}
                alt=""
                fill
                className="object-contain object-center-right w-full object-right"
                sizes="(min-width: 640px) 16vw, 50vw"
              />
            </div>

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
                <div className="text-sm text-slate-brand">{card.label}</div>
                <div className="text-2xl font-bold tracking-tight text-ink">
                  {value != null ? (
                    <>
                      {value}
                      {"suffix" in card && card.suffix && (
                        <span className="ml-1 text-base font-semibold text-slate-brand">
                          {card.suffix}
                        </span>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </div>
                {variation !== undefined && (
                  <div className="flex items-center gap-1 text-sm font-medium text-slate-brand">
                    <span
                      className={`flex items-center gap-0.5 text-xs font-semibold ${
                        variation >= 0
                          ? VARIATION_POSITIVE
                          : VARIATION_NEGATIVE
                      }`}
                    >
                      {variation >= 0 ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )}
                      {variation >= 0 ? "+" : ""}
                      {variation}
                    </span>
                    <span className="text-xs font-normal text-muted-brand">
                      este mes
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
