"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import type { Candidate } from "@workspace/shared/types/candidate";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  CANDIDATE_VACANCY_API_KEY,
  getCandidateVacancies,
} from "@/lib/api/candidate-vacancy";
import { stringToColor, vacancyDisplayLabel } from "@/lib/utils";

interface CandidateGeneralTabProps {
  candidate: Candidate;
}

export const CandidateGeneralTab = ({ candidate }: CandidateGeneralTabProps) => {
  const { data: candidateVacancies } = useQuery({
    queryKey: [CANDIDATE_VACANCY_API_KEY, { candidateId: candidate.id }],
    queryFn: () => getCandidateVacancies({ candidateId: candidate.id }),
  });

  return (
    <div className="rounded-2xl border border-brand-border bg-surface">
      <div className="p-6 lg:p-8">
        <h3 className="text-lg font-bold tracking-tight text-ink">
          Vacantes Asociadas
        </h3>
        <p className="text-sm text-slate-brand mt-1">
          {candidateVacancies?.items.length === 0
            ? "Este candidato no está asociado a ninguna vacante actualmente"
            : `${candidate.name} está participando en ${candidateVacancies?.items.length} procesos de selección`}
        </p>
      </div>
      <div className="px-6 pb-6 lg:px-8 lg:pb-8">
        {candidateVacancies?.items.length === 0 ? (
          <div className="bg-canvas rounded-xl p-6 text-center border border-brand-border-light">
            <p className="text-sm italic text-muted-brand mb-3">
              El candidato forma parte de la base general de candidatos.
            </p>
            <Link href="/vacancies">
              <Button
                variant="brand-outline"
                size="sm"
              >
                Ver todas las vacantes
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {candidateVacancies?.items.map((candidateVacancy) => {
              const color = stringToColor(
                candidateVacancy?.status?.name ?? ""
              );

              return (
                <div
                  key={candidateVacancy.id}
                  className="rounded-xl border border-brand-border p-4 hover:border-electric/20 transition-all ease-[cubic-bezier(0.16,1,0.3,1)]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Link
                      href={`/vacancies/${candidateVacancy?.vacancy?.id}`}
                      className="font-semibold text-ink hover:text-electric transition-colors"
                    >
                      {vacancyDisplayLabel(candidateVacancy?.vacancy)}
                    </Link>
                    <Badge
                      variant="secondary"
                      className="rounded-lg text-xs font-semibold"
                      style={{ backgroundColor: color ?? "gray" }}
                    >
                      {candidateVacancy?.status?.name ?? ""}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-brand">Empresa:</span>{" "}
                      <span className="text-slate-brand">
                        {candidateVacancy?.vacancy?.company?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-brand">Creado:</span>{" "}
                      <span className="text-slate-brand">
                        {new Date(
                          candidateVacancy?.vacancy?.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-brand">
                        Última actualización:
                      </span>{" "}
                      <span className="text-slate-brand">
                        {new Date(
                          candidateVacancy?.updatedAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {candidateVacancy?.notes && (
                    <div className="mt-3 text-sm">
                      <span className="text-muted-brand font-medium">
                        Notas:
                      </span>
                      <p className="mt-1 italic text-slate-brand">
                        {candidateVacancy?.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
