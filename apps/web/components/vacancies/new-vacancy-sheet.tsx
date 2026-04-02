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
        <Button className="bg-electric hover:bg-electric-light text-white rounded-md px-5 py-2 font-semibold shadow-none hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)] transition-all cursor-pointer">
          <Plus className="h-4 w-4" />
          Nueva vacante
        </Button>
      </SheetTrigger>
      {isOpen && (
        <SheetContent className="w-[90%] sm:w-auto sm:max-w-3xl overflow-y-auto bg-surface border-brand-border">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold text-ink">Nueva vacante</SheetTitle>
            <SheetDescription className="text-slate-brand">
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
