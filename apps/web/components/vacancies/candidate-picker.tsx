"use client";

import { useRouter } from "next/navigation";

import { Button } from "@workspace/ui/components/button";
import type { Candidate } from "@workspace/shared/types/candidate";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import { CandidatePickerCard } from "./candidate-picker-card";

interface CandidatePickerProps {
  candidates: Candidate[];
  selectedCandidates: number[];
  toggleCandidateSelection: (candidateId: number) => void;
  vacancy?: Vacancy;
}

export const CandidatePicker = ({
  candidates,
  selectedCandidates,
  toggleCandidateSelection,
  vacancy,
}: CandidatePickerProps) => {
  const router = useRouter();

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-border bg-canvas/50 py-14 text-center">
        <p className="text-base font-semibold text-ink">No se encontraron candidatos</p>
        <p className="mt-1 max-w-xs text-sm text-muted-brand">
          Intenta ajustar los filtros para encontrar más candidatos
        </p>
        {vacancy ? (
          <Button variant="outline" className="mt-5 rounded-xl" onClick={() => router.back()}>
            Volver
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {candidates.map((candidate) => (
        <CandidatePickerCard
          key={candidate.id}
          candidate={candidate}
          isSelected={selectedCandidates.includes(candidate.id)}
          onToggle={() => toggleCandidateSelection(candidate.id)}
        />
      ))}
    </div>
  );
};
