"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CandidateFilters } from "@/components/candidates/candidate-filters";
import { CandidateStars } from "@/components/candidates/candidate-stars";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { CANDIDATE_API_KEY, getAllCandidates } from "@/lib/api/candidate";
import {
  createCandidateVacancy,
  deleteCandidateVacancy,
} from "@/lib/api/candidate-vacancy";
import {
  CANDIDATE_VACANCY_STATUS_API_KEY,
  getAllCandidateVacancyStatus,
} from "@/lib/api/candidate-vacancy-status";
import { VACANCY_API_KEY } from "@/lib/api/vacancy";
import {
  candidateVacancyFiltersAdapter,
  cn,
  vacancyDisplayLabel,
} from "@/lib/utils";
import type {
  CandidateFilters as CandidateFiltersType,
  CandidateParams,
} from "@workspace/shared/types/candidate";
import type { Vacancy } from "@workspace/shared/types/vacancy";

interface AddCandidatesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vacancy: Vacancy;
}

export const AddCandidatesDialog = ({
  isOpen,
  onClose,
  vacancy,
}: AddCandidatesDialogProps) => {
  const queryClient = useQueryClient();

  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [filters, setFilters] = useState<CandidateFiltersType>({
    ...candidateVacancyFiltersAdapter(vacancy?.filters),
    limit: 1e9,
    page: 1,
  });
  const params: CandidateParams = {
    ...filters,
    areaIds: filters.areas?.map((a) => a.id),
    industryIds: filters.industries?.map((i) => i.id),
    seniorityIds: filters.seniorities?.map((s) => s.id),
  };
  const resetFilters = () => {
    setFilters({
      ...candidateVacancyFiltersAdapter(vacancy?.filters),
      limit: 1e9,
      page: 1,
    });
  };
  const clearFilters = () => {
    setFilters({
      limit: 1e9,
      page: 1,
    });
  };

  const { data } = useQuery({
    queryKey: [CANDIDATE_API_KEY, params],
    queryFn: () => getAllCandidates(params),
  });

  const { data: cvs } = useQuery({
    queryKey: [
      CANDIDATE_VACANCY_STATUS_API_KEY,
      { order: "sort:asc", limit: 1e9, page: 1 },
    ],
    queryFn: () =>
      getAllCandidateVacancyStatus({ order: "sort:asc", limit: 1e9, page: 1 }),
  });

  useEffect(() => {
    if (vacancy && data?.items) {
      const existingCandidateIds = vacancy.candidates.map((c) => c.candidate.id);
      const filteredCandidateIds = data.items.map((c) => c.id);

      const existingInFiltered = existingCandidateIds.filter((id) =>
        filteredCandidateIds.includes(id)
      );

      setSelectedCandidates(existingInFiltered);
    }
  }, [vacancy, data?.items]);

  const toggleCandidateSelection = (candidateId: number) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const { mutateAsync } = useMutation({
    mutationFn: () => {
      if (!vacancy?.id) {
        throw new Error("Vacancy ID is required");
      }

      const candidatesOfTheVacancy = vacancy.candidates.map((cv) => cv.candidate);
      const addIds = selectedCandidates.filter(
        (id) => !candidatesOfTheVacancy.some((c) => c.id === id)
      );

      const filteredCandidateIds = data?.items.map((c) => c.id) || [];
      const deleteIds = candidatesOfTheVacancy
        .filter(
          (c) =>
            filteredCandidateIds.includes(c.id) &&
            !selectedCandidates.includes(c.id)
        )
        .map((c) => c.id);

      const cvIds = vacancy.candidates
        .map((cv) =>
          deleteIds.includes(cv.candidate.id) ? cv.id.toString() : null
        )
        .filter((a) => a !== null);
      const defaultCvs = cvs?.items.find((c) => c.isInitial);
      if (!defaultCvs?.id) throw new Error("Error fetching vacancy status");

      return Promise.all([
        ...cvIds.map(deleteCandidateVacancy),
        ...addIds.map((id) =>
          createCandidateVacancy({
            candidateId: id,
            vacancyId: vacancy.id,
            candidateVacancyStatusId: defaultCvs.id,
            notes: "",
          })
        ),
      ]);
    },
    onSuccess: () => {
      toast.success("Postulantes agregados correctamente");
      queryClient
        .invalidateQueries({
          queryKey: [VACANCY_API_KEY, vacancy?.id],
        })
        .then(() => {
          queryClient
            .invalidateQueries({
              queryKey: [
                CANDIDATE_VACANCY_STATUS_API_KEY,
                { order: "sort:asc", limit: 1e9, page: 1 },
              ],
            })
            .then(onClose);
        });
    },
    onError: () => {
      toast.error("Ha ocurrido un error, intente nuevamente");
    },
  });

  const handleAddSelected = () => {
    mutateAsync();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-none max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="!leading-tight">
            Agregar postulantes a &quot;{vacancyDisplayLabel(vacancy)}&quot;
          </DialogTitle>
        </DialogHeader>
        <CandidateFilters
          resetFilters={resetFilters}
          filters={filters}
          onFiltersChange={setFilters}
          clearFilters={clearFilters}
        />

        <div className="my-4">
          {!data ? (
            <div className="gap-y-2 flex flex-column">
              <div className="gap-x-2 flex flex-row">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-36 w-60 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <h3 className="font-medium mb-4">
                Resultados ({data?.items.length ?? 0})
              </h3>
              {data?.items.length === 0 && (
                <div>No se han encontrado candidatos para estos filtros</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {data?.items.map((candidate) => {
                  const isSelected = selectedCandidates.includes(candidate.id);
                  return (
                    <Card
                      key={candidate.id}
                      className={cn(
                        "overflow-hidden flex cursor-pointer relative",
                        {
                          "border-red-500": candidate.blacklist,
                          "border-green-500":
                            candidate.isInCompanyViaPratt &&
                            !candidate.blacklist,
                          "border-2 border-black": isSelected,
                        }
                      )}
                      onClick={() => toggleCandidateSelection(candidate.id)}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-black rounded-full p-1 z-10">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className="relative w-1/4">
                        <Image
                          src={candidate.image || "/images/placeholder.svg"}
                          alt={candidate.name}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                        {candidate.blacklist && (
                          <Badge
                            variant="destructive"
                            className="absolute top-2 right-2"
                          >
                            Blacklist
                          </Badge>
                        )}
                        {!candidate.blacklist &&
                          candidate.isInCompanyViaPratt && (
                            <Badge
                              variant="secondary"
                              className="absolute text-white top-2 right-2 bg-green-500/90 hover:bg-green-500 truncate whitespace-nowrap overflow-hidden max-w-[80px]"
                            >
                              Via Pratt
                            </Badge>
                          )}
                      </div>
                      <CardContent className="p-4 w-3/4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            {candidate.linkedin && (
                              <Link
                                href={candidate.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Image
                                  src="/images/linkedin.svg"
                                  alt="LinkedIn"
                                  width={20}
                                  height={20}
                                  className="inline-block mr-2"
                                />
                              </Link>
                            )}
                            <Link
                              href={`/candidates/${candidate.id}`}
                              target="_blank"
                              className="font-bold text-lg hover:underline"
                            >
                              {candidate.name}
                            </Link>
                          </div>
                        </div>
                        <div className="mb-2">
                          <CandidateStars stars={+candidate.stars} />
                        </div>
                        <div className="text-sm text-gray-500 mb-3">
                          {candidate.shortDescription && (
                            <div className="text-sm">
                              {candidate.shortDescription}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col lg:flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            variant="default"
            onClick={handleAddSelected}
            disabled={selectedCandidates.length === 0}
          >
            Guardar cambios ({selectedCandidates.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
