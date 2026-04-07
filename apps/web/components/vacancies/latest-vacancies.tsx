"use client";

import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Briefcase, Clock, Users } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import type { PaginatedResponse } from "@workspace/shared/types/api";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import { VACANCY_API_KEY, getAllVacancies } from "@/lib/api/vacancy";
import { stringToColor, vacancyDisplayLabel } from "@/lib/utils";

dayjs.extend(relativeTime);
dayjs.locale("es");

interface LatestVacanciesProps {
  openStatusId?: string;
  closedStatusId?: string;
}

export function LatestVacancies({
  openStatusId,
  closedStatusId,
}: LatestVacanciesProps) {
  const { data, isLoading } = useQuery<PaginatedResponse<Vacancy>>({
    queryKey: [VACANCY_API_KEY, { page: 1, limit: 5, order: "createdAt:desc" }],
    queryFn: () =>
      getAllVacancies({ page: 1, limit: 5, order: "createdAt:desc" }),
  });

  const vacancies = data?.items ?? [];

  return (
    <div className="rounded-2xl border border-brand-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-electric">
            <Briefcase className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold tracking-tight text-ink">
            Últimas búsquedas
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/vacancies?status=${openStatusId || "abierta"}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-lg px-2.5 text-[11px] font-semibold text-slate-brand hover:text-electric hover:bg-electric/5"
            >
              Abiertas
            </Button>
          </Link>
          <Link href={`/vacancies?status=${closedStatusId || "cubierta"}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-lg px-2.5 text-[11px] font-semibold text-slate-brand hover:text-electric hover:bg-electric/5"
            >
              Cerradas
            </Button>
          </Link>
          <Link
            href="/vacancies"
            className="flex items-center gap-1 text-xs font-semibold text-electric hover:text-electric-light transition-colors group ml-1"
          >
            Ver todas
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="divide-y divide-brand-border-light">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className="h-9 w-9 rounded-lg bg-brand-border-light animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 rounded bg-brand-border-light animate-pulse" />
                <div className="h-3 w-24 rounded bg-brand-border-light animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : vacancies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-brand">
          <p className="text-sm">Sin búsquedas recientes</p>
        </div>
      ) : (
        <div className="divide-y divide-brand-border-light">
          {vacancies.map((vacancy) => (
            <Link
              key={vacancy.id}
              href={`/vacancies/${vacancy.id}`}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-electric/[0.03] group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate group-hover:text-electric transition-colors">
                  {vacancyDisplayLabel(vacancy)}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-brand truncate">
                    {vacancy.company.name}
                  </span>
                  <span
                    className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: `${stringToColor(vacancy.status.name)}20`,
                      color: stringToColor(vacancy.status.name),
                    }}
                  >
                    {vacancy.status.name}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1 text-muted-brand">
                  <Users className="h-3 w-3" />
                  <span className="text-[11px] font-medium">
                    {vacancy.candidates.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-brand">
                  <Clock className="h-3 w-3" />
                  <span className="text-[11px]">
                    {dayjs(vacancy.createdAt).fromNow()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
