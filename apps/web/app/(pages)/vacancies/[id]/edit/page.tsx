"use client";

import { use } from "react";

import { VacancyWizard } from "@/components/vacancies/wizard/vacancy-wizard";

export default function EditVacancyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const vacancyId = Number(id);
  return <VacancyWizard vacancyId={vacancyId} />;
}
