"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import { VacancyForm } from "./vacancy-form/vacancy-form";

export function NewVacancySheet() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  function onSubmit(values: Vacancy) {
    router.push(`/vacancies/${values.id}/candidate-selection`);
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Nueva vacante
        </Button>
      </SheetTrigger>
      {isOpen && (
        <SheetContent className="w-[90%] sm:w-auto sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nueva vacante</SheetTitle>
            <SheetDescription>
              Complete el formulario para crear una nueva vacante.
            </SheetDescription>
          </SheetHeader>

          <div className="py-4">
            <VacancyForm
              afterSubmit={onSubmit}
              submitLabel="Continuar con selección de postulantes"
            />
          </div>
        </SheetContent>
      )}
    </Sheet>
  );
}
