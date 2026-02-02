"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { vacancyDisplayLabel } from "@/lib/utils";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import type { CreateVacancySchema } from "./new-vacancy.schema";
import { VacancyForm } from "./vacancy-form/vacancy-form";

interface DuplicateVacancySheetProps {
  isOpen: boolean;
  onClose: () => void;
  vacancy: Vacancy;
}

export function DuplicateVacancySheet({
  isOpen,
  onClose,
  vacancy,
}: DuplicateVacancySheetProps) {
  const router = useRouter();

  function afterSubmit() {
    toast.success("Vacante duplicada exitosamente");
    router.push(`/vacancies/${vacancy.id}/candidate-selection`);
  }

  const defaultValues: Partial<CreateVacancySchema> = {
    title: `${vacancy.title} (copia)`,
    description: vacancy.description || "",
    statusId: vacancy.status.id,
    companyId: vacancy.company.id,
    filters: {
      seniorityIds: vacancy.filters?.seniorities?.map((seniority) => seniority.id),
      areaIds: vacancy.filters?.areas?.map((area) => area.id),
      industryIds: vacancy.filters?.industries?.map((industry) => industry.id),
      minStars: vacancy.filters?.minStars,
      gender: vacancy.filters?.gender,
      minAge: vacancy.filters?.minAge,
      maxAge: vacancy.filters?.maxAge,
    },
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[90%] sm:w-auto sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Duplicar vacante</SheetTitle>
          <SheetDescription>
            Se creará una nueva vacante basada en &quot;
            {vacancyDisplayLabel(vacancy)}&quot;. Puede modificar los datos
            antes de confirmar.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <VacancyForm
            afterSubmit={afterSubmit}
            defaultValues={defaultValues}
            submitLabel="Continuar con selección de postulantes"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
