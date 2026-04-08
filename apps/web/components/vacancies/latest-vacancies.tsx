"use client";

import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Briefcase, Building2, Clock, Users } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import type { PaginatedResponse } from "@workspace/shared/types/api";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import { VACANCY_API_KEY, getAllVacancies } from "@/lib/api/vacancy";
import { CATALOG_TYPE_COLORS, getVacancyFilterTags, stringToColor, vacancyDisplayLabel } from "@/lib/utils";
import { CandidateAvatarStack } from "@/components/ui/candidate-avatar-stack";

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
          {vacancies.map((vacancy) => {
            const statusColor = stringToColor(vacancy.status.name);
            const candidateCount = vacancy.candidates.length;
            const tags = getVacancyFilterTags(vacancy.filters);

            return (
              <Link
                key={vacancy.id}
                href={`/vacancies/${vacancy.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-electric/[0.03] group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink truncate group-hover:text-electric transition-colors">
                      {vacancyDisplayLabel(vacancy)}
                    </p>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold rounded-md border-0 px-1.5 py-0 shrink-0"
                      style={{ backgroundColor: statusColor }}
                    >
                      {vacancy.status.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs text-slate-brand">
                      <Building2 className="h-3 w-3 text-muted-brand" />
                      <span className="truncate">{vacancy.company.name}</span>
                    </div>
                    {tags.length > 0 && (
                      <>
                        <span className="text-brand-border text-[10px]">|</span>
                        <div className="flex items-center gap-1 overflow-hidden">
                          {tags.slice(0, 3).map((tag) => (
                            <span
                              key={`${tag.type}-${tag.label}`}
                              className={`inline-flex items-center rounded-md px-1.5 py-0 text-[10px] font-medium shrink-0 ${CATALOG_TYPE_COLORS[tag.type]}`}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {candidateCount > 0 && (
                    <div className="hidden sm:block">
                      <CandidateAvatarStack candidates={vacancy.candidates} />
                    </div>
                  )}


                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-muted-brand">
                      <Users className="h-3 w-3" />
                      <span className="text-[11px] font-medium">
                        {candidateCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-brand">
                      <Clock className="h-3 w-3" />
                      <span className="text-[11px]">
                        {dayjs(vacancy.createdAt).fromNow()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
