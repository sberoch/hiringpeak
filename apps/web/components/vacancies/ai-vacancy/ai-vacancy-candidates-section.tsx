"use client";

import { BriefcaseBusiness, Users } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { CandidatePicker } from "@/components/vacancies/candidate-picker";
import type { Candidate } from "@workspace/shared/types/candidate";
import { AiVacancySection } from "./ai-vacancy-section";

function CandidatePanelSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-brand-border bg-surface"
        >
          <Skeleton className="aspect-[5/4] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface AiVacancyCandidatesSectionProps {
  candidates: Candidate[];
  totalItems: number;
  selectedCandidateIds: number[];
  isLoading: boolean;
  onToggleSelection: (candidateId: number) => void;
}

export function AiVacancyCandidatesSection({
  candidates,
  totalItems,
  selectedCandidateIds,
  isLoading,
  onToggleSelection,
}: AiVacancyCandidatesSectionProps) {
  return (
    <AiVacancySection
      icon={Users}
      title="Primera página de candidatos"
      description="La búsqueda se actualiza automáticamente con el borrador actual."
      headerExtra={
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full border-brand-border">
            <Users className="mr-1 h-3.5 w-3.5" />
            {totalItems} encontrados
          </Badge>
          <Badge variant="outline" className="rounded-full border-brand-border">
            <BriefcaseBusiness className="mr-1 h-3.5 w-3.5" />
            {selectedCandidateIds.length} seleccionados
          </Badge>
        </div>
      }
      contentClassName="pb-8"
    >
      {isLoading && candidates.length === 0 ? (
        <CandidatePanelSkeleton />
      ) : (
        <div className="[content-visibility:auto]">
          <CandidatePicker
            candidates={candidates}
            selectedCandidates={selectedCandidateIds}
            toggleCandidateSelection={onToggleSelection}
          />
        </div>
      )}
    </AiVacancySection>
  );
}
