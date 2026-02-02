"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import type { Candidate } from "@workspace/shared/types/candidate";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vacantes Asociadas</CardTitle>
          <CardDescription>
            {candidateVacancies?.items.length === 0
              ? "Este candidato no está asociado a ninguna vacante actualmente"
              : `${candidate.name} está participando en ${candidateVacancies?.items.length} procesos de selección`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidateVacancies?.items.length === 0 ? (
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm italic text-gray-500 mb-2">
                El candidato forma parte de la base general de candidatos.
              </p>
              <Link href="/vacancies">
                <Button variant="outline" size="sm">
                  Ver todas las vacantes
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {candidateVacancies?.items.map((candidateVacancy) => {
                const color = stringToColor(
                  candidateVacancy?.status?.name ?? ""
                );

                return (
                  <div
                    key={candidateVacancy.id}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Link
                        href={`/vacancies/${candidateVacancy?.vacancy?.id}`}
                        className="font-medium hover:underline"
                      >
                        {vacancyDisplayLabel(candidateVacancy?.vacancy)}
                      </Link>
                      <Badge
                        variant="secondary"
                        style={{ backgroundColor: color ?? "gray" }}
                      >
                        {candidateVacancy?.status?.name ?? ""}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Empresa:</span>{" "}
                        {candidateVacancy?.vacancy?.company?.name}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Creado:</span>{" "}
                        {new Date(
                          candidateVacancy?.vacancy?.createdAt
                        ).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Última actualización:
                        </span>{" "}
                        {new Date(
                          candidateVacancy?.updatedAt
                        ).toLocaleDateString()}
                      </div>
                    </div>

                    {candidateVacancy?.notes && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground font-medium">
                          Notas:
                        </span>
                        <p className="mt-1 italic text-muted-foreground">
                          {candidateVacancy?.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
