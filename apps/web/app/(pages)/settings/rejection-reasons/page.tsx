import type { Metadata } from "next";
import RejectionReasonsSettings from "@/components/settings/rejection-reasons-settings";

export const metadata: Metadata = {
  title: "Motivos de rechazo",
};

export default function RejectionReasonsPage() {
  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight text-ink">Motivos de Rechazo</h2>
        <p className="text-sm text-slate-brand mt-0.5 leading-relaxed">
          Gestiona las categorías que explican por qué se rechaza a un candidato. Se usan en los reportes de vacante y de empresa.
        </p>
      </div>
      <RejectionReasonsSettings />
    </div>
  );
}
