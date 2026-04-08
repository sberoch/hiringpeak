import type { Metadata } from "next";
import { VacancyDetailContent } from "@/components/vacancies/vacancy-detail/vacancy-detail-content";

export const metadata: Metadata = {
  title: "Detalle de vacante",
};

export default async function VacancyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VacancyDetailContent vacancyId={id} />;
}
