import { Metadata } from "next";
import { AiVacancyPage } from "@/components/vacancies/ai-vacancy/ai-vacancy-page";

export const metadata: Metadata = {
  title: "Crear vacante con IA",
};

export default function NewAiVacancyRoute() {
  return <AiVacancyPage />;
}

