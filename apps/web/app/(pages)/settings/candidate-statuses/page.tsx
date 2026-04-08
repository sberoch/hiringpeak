import type { Metadata } from "next";
import CandidateVacancyStatusesSettings from "@/components/settings/candidate-vacancy-statuses-settings";

export const metadata: Metadata = {
  title: "Estados de postulante",
};

export default function CandidateStatusesPage() {
  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight text-ink">Estados de Candidato</h2>
        <p className="text-sm text-slate-brand mt-0.5 leading-relaxed">
          Gestiona los estados disponibles para los candidatos en una vacante.
        </p>
      </div>
      <CandidateVacancyStatusesSettings />
    </div>
  );
}
