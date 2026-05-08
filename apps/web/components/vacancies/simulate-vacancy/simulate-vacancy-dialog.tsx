"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { cn } from "@/lib/utils";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import { SimulateVacancyFilters } from "./simulate-vacancy-filters";
import { SimulateVacancySelection } from "./simulate-vacancy-selection";

interface SimulateVacancyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulateVacancyDialog = ({
  isOpen,
  onClose,
}: SimulateVacancyDialogProps) => {
  const [phase, setPhase] = useState<"selection" | "filters">("selection");
  const [baseVacancy, setBaseVacancy] = useState<Vacancy | undefined>(undefined);

  const handleContinue = (vacancy?: Vacancy) => {
    setBaseVacancy(vacancy);
    setPhase("filters");
  };

  const handleBack = () => {
    setPhase("selection");
  };

  const handleClose = () => {
    onClose();
    setPhase("selection");
    setBaseVacancy(undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "w-[90%] max-h-[90vh] overflow-y-auto",
          phase === "selection"
            ? "lg:w-[75%] sm:max-w-[900px]"
            : "lg:w-[85%] sm:max-w-[1200px]"
        )}
      >
        <DialogHeader>
          <DialogTitle className="!leading-tight text-2xl font-bold tracking-tight text-ink">
            Simular búsqueda
          </DialogTitle>
          <DialogDescription className="text-slate-brand">
            Probá filtros sin crear una vacante en la base de datos.
          </DialogDescription>
        </DialogHeader>

        {phase === "selection" ? (
          <SimulateVacancySelection
            onContinue={handleContinue}
            onCancel={handleClose}
          />
        ) : (
          <SimulateVacancyFilters
            baseVacancy={baseVacancy}
            onBack={handleBack}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
