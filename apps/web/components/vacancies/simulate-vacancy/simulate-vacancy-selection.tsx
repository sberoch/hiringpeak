"use client";

import { useState } from "react";
import { Check, Copy, FileSpreadsheet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { DialogFooter } from "@workspace/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { getAllVacancies, VACANCY_API_KEY } from "@/lib/api/vacancy";
import { cn, vacancyDisplayLabel } from "@/lib/utils";
import type { Vacancy } from "@workspace/shared/types/vacancy";

type SimulationOption = "fromScratch" | "fromVacancy";

interface SimulateVacancySelectionProps {
  onContinue: (vacancy?: Vacancy) => void;
}

export const SimulateVacancySelection = ({
  onContinue,
}: SimulateVacancySelectionProps) => {
  const { data } = useQuery({
    queryKey: [VACANCY_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllVacancies({ limit: 1e9, page: 1 }),
  });

  const [selectedOption, setSelectedOption] = useState<SimulationOption | null>(
    null
  );
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>("");

  const handleContinue = () => {
    if (selectedOption === "fromScratch") {
      onContinue();
    } else if (selectedOption === "fromVacancy" && selectedVacancyId) {
      if (!data) return;
      onContinue(data?.items.find((v) => v.id.toString() === selectedVacancyId));
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-2">
        <Card
          className={cn(
            "overflow-hidden cursor-pointer transition-all relative p-0 h-60 flex flex-col items-center justify-center",
            selectedOption === "fromScratch"
              ? "border-2 border-black"
              : "hover:border-gray-400"
          )}
          onClick={() => setSelectedOption("fromScratch")}
        >
          {selectedOption === "fromScratch" && (
            <div className="absolute top-2 right-2 bg-black rounded-full p-1 z-10">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
          <FileSpreadsheet className="h-16 w-16 mb-4 text-gray-800" />
          <h3 className="text-lg font-medium">Desde cero</h3>
          <p className="text-sm text-center text-gray-500 mt-2 px-6">
            Crear una simulación de búsqueda con filtros nuevos.
          </p>
        </Card>

        <Card
          className={cn(
            "overflow-hidden cursor-pointer transition-all relative p-0 h-60 flex flex-col items-center justify-center",
            selectedOption === "fromVacancy"
              ? "border-2 border-black"
              : "hover:border-gray-400"
          )}
          onClick={() => setSelectedOption("fromVacancy")}
        >
          {selectedOption === "fromVacancy" && (
            <div className="absolute top-2 right-2 bg-black rounded-full p-1 z-10">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
          <Copy className="h-16 w-16 mb-4 text-gray-800" />
          <h3 className="text-lg font-medium">A partir de otra vacante</h3>
          <p className="text-sm text-center text-gray-500 mt-2 px-6">
            Usar los filtros de una vacante existente como punto de partida.
          </p>
        </Card>
      </div>

      {selectedOption === "fromVacancy" && (
        <div className="mb-4">
          <h3 className="text-md font-medium mb-3">Seleccionar vacante</h3>
          <Select
            value={selectedVacancyId}
            onValueChange={setSelectedVacancyId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una vacante" />
            </SelectTrigger>
            <SelectContent>
              {data?.items.map((vacancy) => (
                <SelectItem key={vacancy.id} value={vacancy.id.toString()}>
                  {vacancyDisplayLabel(vacancy)} - {vacancy.company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <DialogFooter>
        <Button
          variant="default"
          className="w-full md:w-auto"
          disabled={
            !selectedOption ||
            (selectedOption === "fromVacancy" && !selectedVacancyId)
          }
          onClick={handleContinue}
        >
          Continuar
        </Button>
      </DialogFooter>
    </>
  );
};
