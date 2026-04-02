import VacancyStatusesSettings from "@/components/settings/vacancy-statuses-settings";

export default function VacancyStatusesPage() {
  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight text-ink">Estados de Vacante</h2>
        <p className="text-sm text-slate-brand mt-0.5 leading-relaxed">
          Gestiona los estados disponibles para las vacantes.
        </p>
      </div>
      <VacancyStatusesSettings />
    </div>
  );
}
