import { redirect } from "next/navigation";

export default function NewAiVacancyRoute() {
  redirect("/vacancies/new?source=ai");
}
