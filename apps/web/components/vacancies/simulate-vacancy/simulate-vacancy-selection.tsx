"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@workspace/ui/components/button";
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
  onCancel?: () => void;
}

interface OptionCardProps {
  image: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

const OptionCard = ({
  image,
  title,
  description,
  selected,
  onClick,
}: OptionCardProps) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    }}
    className={cn(
      "group relative flex flex-col overflow-hidden rounded-2xl border bg-surface text-left cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
      "hover:-translate-y-1 hover:shadow-[0_12px_32px_-8px_rgba(15,23,42,0.12)]",
      selected
        ? "border-ink ring-2 ring-ink"
        : "border-brand-border hover:border-brand-border"
    )}
  >
    <div className="flex h-40 w-full shrink-0 items-center justify-center p-5">
      <Image
        src={image}
        alt=""
        width={320}
        height={160}
        className="h-full w-auto object-contain"
      />
    </div>
    <div className="flex-1 px-6 py-5 border-t border-brand-border">
      <h3 className="text-lg font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-brand">
        {description}
      </p>
    </div>
  </div>
);

export const SimulateVacancySelection = ({
  onContinue,
  onCancel,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        <OptionCard
          image="/images/stat-search.png"
          title="Desde cero"
          description="Crear una simulación de búsqueda con filtros nuevos."
          selected={selectedOption === "fromScratch"}
          onClick={() => setSelectedOption("fromScratch")}
        />

        <OptionCard
          image="/images/stat-candidates.jpeg"
          title="A partir de otra vacante"
          description="Usar los filtros de una vacante existente como punto de partida."
          selected={selectedOption === "fromVacancy"}
          onClick={() => setSelectedOption("fromVacancy")}
        />
      </div>

      {selectedOption === "fromVacancy" && (
        <div className="mt-2 animate-[fade-up_300ms_cubic-bezier(0.16,1,0.3,1)_forwards]">
          <label className="block text-sm font-medium text-ink mb-2">
            Vacante base
          </label>
          <Select
            value={selectedVacancyId}
            onValueChange={setSelectedVacancyId}
          >
            <SelectTrigger className="w-full rounded-xl border-brand-border bg-canvas text-ink focus:border-electric focus:ring-electric/10">
              <SelectValue placeholder="Selecciona una vacante" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-brand-border bg-surface">
              {data?.items.map((vacancy) => (
                <SelectItem key={vacancy.id} value={vacancy.id.toString()}>
                  {vacancyDisplayLabel(vacancy)} - {vacancy.company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <DialogFooter className="mt-2">
        {onCancel && (
          <Button variant="brand-ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button
          variant="brand"
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
