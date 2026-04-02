import SenioritiesSettings from "@/components/settings/seniorities-settings";

export default function SenioritiesPage() {
  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight text-ink">Seniority</h2>
        <p className="text-sm text-slate-brand mt-0.5 leading-relaxed">
          Gestiona los seniorities disponibles para los postulantes.
        </p>
      </div>
      <SenioritiesSettings />
    </div>
  );
}
