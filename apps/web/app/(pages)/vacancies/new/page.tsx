"use client";

import { useRouter } from "next/navigation";

import { Heading } from "@workspace/ui/components/heading";
import { VacancyForm } from "@/components/vacancies/vacancy-form/vacancy-form";
import type { Vacancy } from "@workspace/shared/types/vacancy";

export default function NewVacancy() {
  const router = useRouter();

  function onSubmit(data: Vacancy) {
    router.push(`/vacancies/${data.id}/candidate-selection`);
  }

  return (
    <div className="container flex flex-col">
      <Heading>Nueva vacante</Heading>
      <div className="w-full mt-8 mb-16">
        <VacancyForm
          afterSubmit={onSubmit}
          submitLabel="Continuar con selección de postulantes"
        />
      </div>
    </div>
  );
}
