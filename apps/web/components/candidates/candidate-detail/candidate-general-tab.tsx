"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Building2, Briefcase } from "lucide-react";

import type { Candidate } from "@workspace/shared/types/candidate";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  CANDIDATE_VACANCY_API_KEY,
  getCandidateVacancies,
} from "@/lib/api/candidate-vacancy";
import { CATALOG_TYPE_COLORS, getVacancyFilterTags, stringToColor, vacancyDisplayLabel } from "@/lib/utils";

interface CandidateGeneralTabProps {
  candidate: Candidate;
}

export const CandidateGeneralTab = ({ candidate }: CandidateGeneralTabProps) => {
  const { data: candidateVacancies } = useQuery({
    queryKey: [CANDIDATE_VACANCY_API_KEY, { candidateId: candidate.id }],
    queryFn: () => getCandidateVacancies({ candidateId: candidate.id }),
  });

  return (
    <div className="rounded-2xl border border-brand-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.04)] h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="h-4 w-4 text-electric" />
          <h3 className="text-sm font-semibold text-ink">
            Vacantes Asociadas
          </h3>
        </div>
        <p className="text-sm text-slate-brand">
          {candidateVacancies?.items.length === 0
            ? "Este candidato no está asociado a ninguna vacante actualmente"
            : `${candidate.name} está participando en ${candidateVacancies?.items.length} procesos de selección`}
        </p>
      </div>
      <div className="px-6 pb-6">
        {candidateVacancies?.items.length === 0 ? (
          <div className="bg-canvas rounded-xl p-6 text-center border border-brand-border-light">
            <p className="text-sm italic text-muted-brand mb-3">
              El candidato forma parte de la base general de candidatos.
            </p>
            <Link href="/vacancies">
              <Button variant="brand-outline" size="sm">
                Ver todas las vacantes
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {candidateVacancies?.items.map((candidateVacancy) => {
              const vacancyStatusColor = stringToColor(
                candidateVacancy?.vacancy?.status?.name ?? ""
              );
              const cvStatus =
                (candidateVacancy as any)?.candidateVacancyStatus ??
                candidateVacancy?.status;
              const candidateStatusColor = stringToColor(
                cvStatus?.name ?? ""
              );
              const vacancy = candidateVacancy?.vacancy;
              const daysDiff = vacancy?.createdAt
                ? dayjs().diff(dayjs(vacancy.createdAt), "day")
                : null;

              const tags = getVacancyFilterTags(vacancy?.filters);

              return (
                <Link
                  key={candidateVacancy.id}
                  href={`/vacancies/${vacancy?.id}`}
                  className="block rounded-xl border border-brand-border p-4 hover:border-electric/20 hover:bg-canvas/50 transition-all ease-[cubic-bezier(0.16,1,0.3,1)]"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm font-semibold text-ink truncate">
                        {vacancyDisplayLabel(vacancy)}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold rounded-md border-0 px-1.5 py-0 shrink-0"
                        style={{ backgroundColor: vacancyStatusColor }}
                      >
                        {vacancy?.status?.name}
                      </Badge>
                    </div>
                    {daysDiff !== null && (
                      <span className="text-[11px] text-muted-brand shrink-0">
                        {daysDiff}d
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-slate-brand">
                      <Building2 className="h-3 w-3 text-muted-brand" />
                      <span className="truncate">
                        {vacancy?.company?.name}
                      </span>
                    </div>
                    {tags.length > 0 && (
                      <>
                        <span className="text-brand-border text-[10px]">|</span>
                        {tags.slice(0, 4).map((tag) => (
                          <span
                            key={`${tag.type}-${tag.label}`}
                            className={`inline-flex items-center rounded-md px-1.5 py-0 text-[10px] font-medium shrink-0 ${CATALOG_TYPE_COLORS[tag.type]}`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-brand">
                      Estado del candidato:
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[11px] font-semibold rounded-md"
                      style={{ backgroundColor: candidateStatusColor }}
                    >
                      {cvStatus?.name ?? "Sin estado"}
                    </Badge>
                  </div>

                  {candidateVacancy?.notes && (
                    <p className="mt-2 text-xs italic text-slate-brand border-t border-brand-border-light pt-2">
                      {candidateVacancy.notes}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
