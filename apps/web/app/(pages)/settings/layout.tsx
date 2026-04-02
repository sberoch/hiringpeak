import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { Settings } from "lucide-react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col mb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Configuración
            </h1>
            <p className="text-sm text-slate-brand leading-relaxed">
              Gestiona las configuraciones del sistema de reclutamiento.
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar + Content */}
      <div className="flex gap-8">
        <SettingsSidebar />
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
