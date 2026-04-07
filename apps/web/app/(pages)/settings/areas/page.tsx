import type { Metadata } from "next";
import AreasSettings from "@/components/settings/areas-settings";

export const metadata: Metadata = {
  title: "Áreas",
};

export default function AreasPage() {
  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight text-ink">Áreas</h2>
        <p className="text-sm text-slate-brand mt-0.5 leading-relaxed">
          Gestiona las áreas disponibles para los postulantes.
        </p>
      </div>
      <AreasSettings />
    </div>
  );
}
