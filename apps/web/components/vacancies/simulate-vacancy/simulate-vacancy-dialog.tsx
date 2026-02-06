"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { cn } from "@/lib/utils";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import { SimulateVacancyFilters } from "./simulate-vacancy-filters";
import { SimulateVacancySelection } from "./simulate-vacancy-selection";
import { SimulateVacancyTargetSelection } from "./simulate-vacancy-target-selection";

interface SimulateVacancyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulateVacancyDialog = ({
  isOpen,
  onClose,
}: SimulateVacancyDialogProps) => {
  const [phase, setPhase] = useState<
    "selection" | "filters" | "target-selection"
  >("selection");
  const [baseVacancy, setBaseVacancy] = useState<Vacancy | undefined>(undefined);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [targetVacancy, setTargetVacancy] = useState<Vacancy | undefined>(
    undefined
  );

  const handleContinue = (vacancy?: Vacancy) => {
    setBaseVacancy(vacancy);
    setPhase("filters");
  };

  const handleBack = () => {
    if (phase === "target-selection") {
      setPhase("filters");
    } else {
      setPhase("selection");
    }
  };

  const handleTargetSelection = (candidates: number[]) => {
    setSelectedCandidates(candidates);
    setPhase("target-selection");
  };

  const handleVacancySelected = () => {
    handleClose();
  };

  const handleClose = () => {
    onClose();
    if (!isOpen) {
      setPhase("selection");
      setBaseVacancy(undefined);
      setSelectedCandidates([]);
      setTargetVacancy(undefined);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "w-[90%] max-w-none max-h-[90vh] overflow-y-auto",
          phase === "filters" ? "lg:w-[80%]" : "lg:w-[50%]"
        )}
      >
        <DialogHeader>
          <DialogTitle className="!leading-tight text-xl">
            Simular búsqueda
          </DialogTitle>
        </DialogHeader>

        {phase === "selection" ? (
          <SimulateVacancySelection onContinue={handleContinue} />
        ) : phase === "target-selection" ? (
          <SimulateVacancyTargetSelection
            onBack={handleBack}
            onSuccess={handleVacancySelected}
            selectedCandidates={selectedCandidates}
          />
        ) : (
          <SimulateVacancyFilters
            baseVacancy={baseVacancy || targetVacancy}
            onBack={handleBack}
            close={handleClose}
            onTargetSelection={baseVacancy ? undefined : handleTargetSelection}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
