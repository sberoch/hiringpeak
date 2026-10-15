import type { Metadata } from "next";
import ContactSourcesSettings from "@/components/settings/contact-sources-settings";

export const metadata: Metadata = {
  title: "Orígenes de contacto",
};

export default function ContactSourcesPage() {
  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight text-ink">
          Orígenes de contacto
        </h2>
        <p className="text-sm text-slate-brand mt-0.5 leading-relaxed">
          Gestiona de dónde vienen los contactos de tu red comercial (el
          «Origen» de cada contacto).
        </p>
      </div>
      <ContactSourcesSettings />
    </div>
  );
}
