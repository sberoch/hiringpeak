import SourcesSettings from "@/components/settings/sources-settings";

export default function SourcesPage() {
  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight text-ink">Fuentes</h2>
        <p className="text-sm text-slate-brand mt-0.5 leading-relaxed">
          Gestiona las fuentes de reclutamiento disponibles.
        </p>
      </div>
      <SourcesSettings />
    </div>
  );
}
